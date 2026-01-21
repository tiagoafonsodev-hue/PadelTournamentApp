package com.padel.tournament.repository

import androidx.lifecycle.LiveData
import com.padel.tournament.data.dao.PlayerDao
import com.padel.tournament.data.dao.PlayerStatsDao
import com.padel.tournament.data.entities.Player
import com.padel.tournament.data.entities.PlayerStats

class PlayerRepository(
    private val playerDao: PlayerDao,
    private val playerStatsDao: PlayerStatsDao
) {
    
    fun getAllPlayers(): LiveData<List<Player>> = playerDao.getAllPlayers()
    
    suspend fun getPlayerById(playerId: Long): Player? = playerDao.getPlayerById(playerId)
    
    suspend fun getPlayersByIds(playerIds: List<Long>): List<Player> = playerDao.getPlayersByIds(playerIds)
    
    suspend fun searchPlayers(query: String): List<Player> = playerDao.searchPlayers("%$query%")
    
    suspend fun insertPlayer(player: Player): Long {
        val playerId = playerDao.insertPlayer(player)
        val initialStats = PlayerStats(playerId = playerId)
        playerStatsDao.insertPlayerStats(initialStats)
        return playerId
    }
    
    suspend fun updatePlayer(player: Player) = playerDao.updatePlayer(player)
    
    suspend fun deletePlayer(player: Player) {
        playerStatsDao.deletePlayerStatsById(player.id)
        playerDao.deletePlayer(player)
    }
    
    suspend fun getPlayerCount(): Int = playerDao.getPlayerCount()
}