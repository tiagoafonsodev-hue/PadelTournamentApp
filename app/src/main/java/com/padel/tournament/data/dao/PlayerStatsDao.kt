package com.padel.tournament.data.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import com.padel.tournament.data.entities.PlayerStats

@Dao
interface PlayerStatsDao {
    
    @Query("SELECT * FROM player_stats ORDER BY winPercentage DESC, matchesWon DESC")
    fun getAllPlayerStats(): LiveData<List<PlayerStats>>
    
    @Query("SELECT * FROM player_stats WHERE playerId = :playerId")
    suspend fun getPlayerStats(playerId: Long): PlayerStats?
    
    @Query("SELECT * FROM player_stats ORDER BY winPercentage DESC, matchesWon DESC LIMIT :limit")
    suspend fun getTopPlayers(limit: Int): List<PlayerStats>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPlayerStats(playerStats: PlayerStats)
    
    @Update
    suspend fun updatePlayerStats(playerStats: PlayerStats)
    
    @Delete
    suspend fun deletePlayerStats(playerStats: PlayerStats)
    
    @Query("DELETE FROM player_stats WHERE playerId = :playerId")
    suspend fun deletePlayerStatsById(playerId: Long)
    
    @Query("""
        UPDATE player_stats SET 
        totalMatches = totalMatches + 1,
        matchesWon = CASE WHEN :won = 1 THEN matchesWon + 1 ELSE matchesWon END,
        matchesLost = CASE WHEN :won = 0 THEN matchesLost + 1 ELSE matchesLost END,
        setsWon = setsWon + :setsWon,
        setsLost = setsLost + :setsLost,
        gamesWon = gamesWon + :gamesWon,
        gamesLost = gamesLost + :gamesLost,
        winPercentage = CASE WHEN (totalMatches + 1) > 0 
                            THEN CAST((matchesWon + CASE WHEN :won = 1 THEN 1 ELSE 0 END) AS REAL) / (totalMatches + 1) * 100
                            ELSE 0 END,
        lastUpdated = :timestamp
        WHERE playerId = :playerId
    """)
    suspend fun updateStatsAfterMatch(
        playerId: Long,
        won: Int,
        setsWon: Int,
        setsLost: Int,
        gamesWon: Int,
        gamesLost: Int,
        timestamp: Long
    )
}