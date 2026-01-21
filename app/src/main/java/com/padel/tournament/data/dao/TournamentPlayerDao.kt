package com.padel.tournament.data.dao

import androidx.room.*
import com.padel.tournament.data.entities.TournamentPlayer

@Dao
interface TournamentPlayerDao {
    
    @Query("SELECT * FROM tournament_players WHERE tournamentId = :tournamentId")
    suspend fun getPlayersForTournament(tournamentId: Long): List<TournamentPlayer>
    
    @Query("SELECT * FROM tournament_players WHERE tournamentId = :tournamentId AND groupNumber = :groupNumber")
    suspend fun getPlayersForGroup(tournamentId: Long, groupNumber: Int): List<TournamentPlayer>
    
    @Query("SELECT COUNT(*) FROM tournament_players WHERE tournamentId = :tournamentId")
    suspend fun getPlayerCountForTournament(tournamentId: Long): Int
    
    @Query("SELECT MAX(groupNumber) FROM tournament_players WHERE tournamentId = :tournamentId")
    suspend fun getMaxGroupNumber(tournamentId: Long): Int?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTournamentPlayer(tournamentPlayer: TournamentPlayer)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTournamentPlayers(tournamentPlayers: List<TournamentPlayer>)
    
    @Delete
    suspend fun deleteTournamentPlayer(tournamentPlayer: TournamentPlayer)
    
    @Query("DELETE FROM tournament_players WHERE tournamentId = :tournamentId")
    suspend fun deleteAllPlayersFromTournament(tournamentId: Long)
    
    @Update
    suspend fun updateTournamentPlayer(tournamentPlayer: TournamentPlayer)
}