package com.padel.tournament.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch
import com.padel.tournament.data.database.PadelDatabase
import com.padel.tournament.data.entities.PlayerStats
import com.padel.tournament.data.entities.Player

class LeaderboardViewModel(application: Application) : AndroidViewModel(application) {
    
    private val database = PadelDatabase.getDatabase(application)
    val allPlayerStats: LiveData<List<PlayerStats>> = database.playerStatsDao().getAllPlayerStats()
    
    private val _playersWithStats = MutableLiveData<List<PlayerWithStats>>()
    val playersWithStats: LiveData<List<PlayerWithStats>> = _playersWithStats
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error
    
    init {
        loadPlayersWithStats()
    }
    
    fun loadPlayersWithStats() {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null
                
                val stats = database.playerStatsDao().getAllPlayerStats().value ?: emptyList()
                val playersWithStatsData = mutableListOf<PlayerWithStats>()
                
                for (stat in stats) {
                    val player = database.playerDao().getPlayerById(stat.playerId)
                    if (player != null) {
                        playersWithStatsData.add(PlayerWithStats(player, stat))
                    }
                }
                
                // Sort by win percentage, then by matches won
                val sortedData = playersWithStatsData.sortedWith { p1, p2 ->
                    when {
                        p1.stats.winPercentage != p2.stats.winPercentage -> 
                            p2.stats.winPercentage.compareTo(p1.stats.winPercentage)
                        else -> p2.stats.matchesWon.compareTo(p1.stats.matchesWon)
                    }
                }
                
                _playersWithStats.value = sortedData
                
            } catch (e: Exception) {
                _error.value = "Failed to load leaderboard: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun getTopPlayers(limit: Int = 10) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null
                
                val topStats = database.playerStatsDao().getTopPlayers(limit)
                val playersWithStatsData = mutableListOf<PlayerWithStats>()
                
                for (stat in topStats) {
                    val player = database.playerDao().getPlayerById(stat.playerId)
                    if (player != null) {
                        playersWithStatsData.add(PlayerWithStats(player, stat))
                    }
                }
                
                _playersWithStats.value = playersWithStatsData
                
            } catch (e: Exception) {
                _error.value = "Failed to load top players: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun clearError() {
        _error.value = null
    }
    
    data class PlayerWithStats(
        val player: Player,
        val stats: PlayerStats
    )
}