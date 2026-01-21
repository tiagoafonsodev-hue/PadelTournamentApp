package com.padel.tournament.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch
import com.padel.tournament.data.database.PadelDatabase
import com.padel.tournament.data.entities.Tournament
import com.padel.tournament.data.entities.TournamentType
import com.padel.tournament.repository.TournamentRepository
import com.padel.tournament.utils.TournamentScheduler

class TournamentCreationViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository: TournamentRepository
    
    // Tournament creation state
    val tournamentName = MutableLiveData<String>()
    val tournamentType = MutableLiveData<TournamentType>()
    val selectedPlayers = MutableLiveData<MutableList<Long>>(mutableListOf())
    
    val isLoading = MutableLiveData<Boolean>()
    val error = MutableLiveData<String?>()
    val tournamentCreated = MutableLiveData<Long?>()
    
    init {
        val database = PadelDatabase.getDatabase(application)
        repository = TournamentRepository(
            database.tournamentDao(),
            database.tournamentPlayerDao(),
            database.matchDao()
        )
    }
    
    fun setTournamentName(name: String) {
        tournamentName.value = name
    }
    
    fun setTournamentType(type: TournamentType) {
        tournamentType.value = type
    }
    
    fun togglePlayerSelection(playerId: Long) {
        val current = selectedPlayers.value ?: mutableListOf()
        if (current.contains(playerId)) {
            current.remove(playerId)
        } else {
            current.add(playerId)
        }
        selectedPlayers.value = current
    }
    
    fun isPlayerSelected(playerId: Long): Boolean {
        return selectedPlayers.value?.contains(playerId) == true
    }
    
    fun getSelectedPlayerCount(): Int {
        return selectedPlayers.value?.size ?: 0
    }
    
    fun getRequiredPlayerCount(): String {
        val type = tournamentType.value ?: TournamentType.ROUND_ROBIN
        return when (type) {
            TournamentType.ROUND_ROBIN -> "4, 6, 8, 12, 16"
            TournamentType.KNOCKOUT -> "4, 8, 16"
            TournamentType.GROUP_STAGE_KNOCKOUT -> "8, 12, 16"
        }
    }
    
    fun isValidPlayerCount(): Boolean {
        val count = getSelectedPlayerCount()
        val type = tournamentType.value ?: TournamentType.ROUND_ROBIN
        
        return when (type) {
            TournamentType.ROUND_ROBIN -> count >= 4 && count % 2 == 0
            TournamentType.KNOCKOUT -> count >= 4 && isPowerOfTwo(count)
            TournamentType.GROUP_STAGE_KNOCKOUT -> count >= 8 && count % 4 == 0
        }
    }
    
    private fun isPowerOfTwo(n: Int): Boolean {
        return n > 0 && (n and (n - 1)) == 0
    }
    
    fun createTournament() {
        val name = tournamentName.value
        val type = tournamentType.value
        val players = selectedPlayers.value
        
        if (name.isNullOrBlank() || type == null || players.isNullOrEmpty()) {
            error.value = "Missing tournament information"
            return
        }
        
        if (!isValidPlayerCount()) {
            error.value = "Invalid number of players for ${type.name} tournament"
            return
        }
        
        viewModelScope.launch {
            try {
                isLoading.value = true
                error.value = null
                
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
                repository.addPlayersToTournament(tournamentId, players)
                
                generateInitialMatches(tournamentId, type, players)
                
                tournamentCreated.value = tournamentId
                
                // Clear state after successful creation
                clearState()
                
            } catch (e: Exception) {
                error.value = "Failed to create tournament: ${e.message}"
            } finally {
                isLoading.value = false
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
        repository.updateTournamentStatus(tournamentId, com.padel.tournament.data.entities.TournamentStatus.IN_PROGRESS)
    }
    
    fun clearState() {
        tournamentName.value = null
        tournamentType.value = null
        selectedPlayers.value = mutableListOf()
        error.value = null
        tournamentCreated.value = null
    }
    
    fun clearError() {
        error.value = null
    }
}