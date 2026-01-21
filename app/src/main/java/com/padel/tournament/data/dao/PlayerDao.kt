package com.padel.tournament.data.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import com.padel.tournament.data.entities.Player

@Dao
interface PlayerDao {
    
    @Query("SELECT * FROM players ORDER BY name ASC")
    fun getAllPlayers(): LiveData<List<Player>>
    
    @Query("SELECT * FROM players WHERE id = :playerId")
    suspend fun getPlayerById(playerId: Long): Player?
    
    @Query("SELECT * FROM players WHERE id IN (:playerIds)")
    suspend fun getPlayersByIds(playerIds: List<Long>): List<Player>
    
    @Query("SELECT * FROM players WHERE name LIKE :searchQuery ORDER BY name ASC")
    suspend fun searchPlayers(searchQuery: String): List<Player>
    
    @Insert
    suspend fun insertPlayer(player: Player): Long
    
    @Update
    suspend fun updatePlayer(player: Player)
    
    @Delete
    suspend fun deletePlayer(player: Player)
    
    @Query("DELETE FROM players WHERE id = :playerId")
    suspend fun deletePlayerById(playerId: Long)
    
    @Query("SELECT COUNT(*) FROM players")
    suspend fun getPlayerCount(): Int
}