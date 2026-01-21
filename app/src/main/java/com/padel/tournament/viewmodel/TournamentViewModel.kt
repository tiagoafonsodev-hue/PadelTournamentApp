package com.padel.tournament.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch
import com.padel.tournament.data.database.PadelDatabase
import com.padel.tournament.data.entities.Tournament
import com.padel.tournament.data.entities.TournamentType
import com.padel.tournament.data.entities.TournamentStatus
import com.padel.tournament.repository.TournamentRepository
import com.padel.tournament.utils.TournamentScheduler

class TournamentViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository: TournamentRepository
    val allTournaments: LiveData<List<Tournament>>
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error
    
    private val _tournamentCreated = MutableLiveData<Long?>()
    val tournamentCreated: LiveData<Long?> = _tournamentCreated
    
    init {
        val database = PadelDatabase.getDatabase(application)
        repository = TournamentRepository(
            database.tournamentDao(),
            database.tournamentPlayerDao(),
            database.matchDao()
        )
        allTournaments = repository.getAllTournaments()
    }
    
    fun createTournament(
        name: String,
        type: TournamentType,
        playerIds: List<Long>
    ) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null
                
                if (name.isBlank()) {
                    _error.value = "Tournament name cannot be empty"
                    return@launch
                }
                
                if (playerIds.size < 4) {
                    _error.value = "At least 4 players are required for a padel tournament"
                    return@launch
                }
                
                if (playerIds.size % 4 != 0) {
                    _error.value = "Number of players must be divisible by 4 for padel tournaments"
                    return@launch
                }
                
                val maxPhases = when (type) {
                    TournamentType.ROUND_ROBIN -> 1
                    TournamentType.KNOCKOUT -> 1
                    TournamentType.GROUP_STAGE_KNOCKOUT -> 2
                }
                
                val tournament = Tournament(
                    name = name.trim(),
                    type = type,
                    maxPhases = maxPhases
                )
                
                val tournamentId = repository.insertTournament(tournament)
                repository.addPlayersToTournament(tournamentId, playerIds)
                
                generateInitialMatches(tournamentId, type, playerIds)
                
                _tournamentCreated.value = tournamentId
                
            } catch (e: Exception) {
                _error.value = "Failed to create tournament: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    private suspend fun generateInitialMatches(
        tournamentId: Long,
        type: TournamentType,
        playerIds: List<Long>
    ) {
        val scheduler = TournamentScheduler()
        val matches = when (type) {
            TournamentType.ROUND_ROBIN -> scheduler.generateRoundRobinMatches(tournamentId, playerIds)
            TournamentType.KNOCKOUT -> scheduler.generateKnockoutMatches(tournamentId, playerIds)
            TournamentType.GROUP_STAGE_KNOCKOUT -> scheduler.generateGroupStageMatches(tournamentId, playerIds)
        }
        
        repository.insertMatches(matches)
        repository.updateTournamentStatus(tournamentId, TournamentStatus.IN_PROGRESS)
    }
    
    fun deleteTournament(tournament: Tournament) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null
                repository.deleteTournament(tournament)
            } catch (e: Exception) {
                _error.value = "Failed to delete tournament: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun clearError() {
        _error.value = null
    }
    
    fun clearTournamentCreated() {
        _tournamentCreated.value = null
    }
}