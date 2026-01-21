package com.padel.tournament.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch
import com.padel.tournament.data.database.PadelDatabase
import com.padel.tournament.data.entities.Match
import com.padel.tournament.data.entities.Player
import com.padel.tournament.data.entities.PlayerStats
import com.padel.tournament.repository.PlayerRepository
import com.padel.tournament.repository.TournamentRepository

class MatchViewModel(application: Application) : AndroidViewModel(application) {
    
    private val tournamentRepository: TournamentRepository
    private val playerRepository: PlayerRepository
    private val database = PadelDatabase.getDatabase(application)
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error
    
    init {
        tournamentRepository = TournamentRepository(
            database.tournamentDao(),
            database.tournamentPlayerDao(),
            database.matchDao()
        )
        playerRepository = PlayerRepository(
            database.playerDao(),
            database.playerStatsDao()
        )
    }
    
    fun getMatchesForTournament(tournamentId: Long): LiveData<List<Match>> {
        return tournamentRepository.getMatchesForTournament(tournamentId)
    }
    
    fun updateMatchResult(match: Match) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null
                
                database.matchDao().updateMatch(match)
                updatePlayerStats(match)
                
                // Check if tournament phase should advance
                val progressManager = com.padel.tournament.utils.TournamentProgressManager(
                    database.tournamentDao(),
                    database.matchDao(),
                    database.tournamentPlayerDao()
                )
                progressManager.checkAndAdvancePhase(match.tournamentId)
                
            } catch (e: Exception) {
                _error.value = "Failed to update match result: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    private suspend fun updatePlayerStats(match: Match) {
        if (match.winnerTeam == null) return
        
        val playerIds = listOf(match.player1Id, match.player2Id, match.player3Id, match.player4Id)
        val team1Ids = listOf(match.player1Id, match.player2Id)
        val team2Ids = listOf(match.player3Id, match.player4Id)
        
        val team1Won = match.winnerTeam == 1
        val team2Won = match.winnerTeam == 2
        
        // Calculate games won/lost for each team
        val team1GamesWon = (match.set1Team1 ?: 0) + (match.set2Team1 ?: 0) + (match.set3Team1 ?: 0)
        val team1GamesLost = (match.set1Team2 ?: 0) + (match.set2Team2 ?: 0) + (match.set3Team2 ?: 0)
        val team2GamesWon = team1GamesLost
        val team2GamesLost = team1GamesWon
        
        // Calculate sets won/lost
        var team1SetsWon = 0
        var team2SetsWon = 0
        
        if (match.set1Team1 != null && match.set1Team2 != null) {
            if (match.set1Team1 > match.set1Team2) team1SetsWon++ else team2SetsWon++
        }
        if (match.set2Team1 != null && match.set2Team2 != null) {
            if (match.set2Team1 > match.set2Team2) team1SetsWon++ else team2SetsWon++
        }
        if (match.set3Team1 != null && match.set3Team2 != null) {
            if (match.set3Team1 > match.set3Team2) team1SetsWon++ else team2SetsWon++
        }
        
        val team1SetsLost = team2SetsWon
        val team2SetsLost = team1SetsWon
        
        val timestamp = System.currentTimeMillis()
        
        // Update stats for team 1 players
        team1Ids.forEach { playerId ->
            database.playerStatsDao().updateStatsAfterMatch(
                playerId = playerId,
                won = if (team1Won) 1 else 0,
                setsWon = team1SetsWon,
                setsLost = team1SetsLost,
                gamesWon = team1GamesWon,
                gamesLost = team1GamesLost,
                timestamp = timestamp
            )
        }
        
        // Update stats for team 2 players
        team2Ids.forEach { playerId ->
            database.playerStatsDao().updateStatsAfterMatch(
                playerId = playerId,
                won = if (team2Won) 1 else 0,
                setsWon = team2SetsWon,
                setsLost = team2SetsLost,
                gamesWon = team2GamesWon,
                gamesLost = team2GamesLost,
                timestamp = timestamp
            )
        }
    }
    
    suspend fun getPlayersById(playerIds: List<Long>): List<Player> {
        return playerRepository.getPlayersByIds(playerIds)
    }
    
    fun clearError() {
        _error.value = null
    }
}