package com.padel.tournament.data.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import com.padel.tournament.data.entities.Tournament
import com.padel.tournament.data.entities.TournamentStatus

@Dao
interface TournamentDao {
    
    @Query("SELECT * FROM tournaments ORDER BY createdAt DESC")
    fun getAllTournaments(): LiveData<List<Tournament>>
    
    @Query("SELECT * FROM tournaments WHERE id = :tournamentId")
    suspend fun getTournamentById(tournamentId: Long): Tournament?
    
    @Query("SELECT * FROM tournaments WHERE status = :status ORDER BY createdAt DESC")
    suspend fun getTournamentsByStatus(status: TournamentStatus): List<Tournament>
    
    @Query("SELECT * FROM tournaments WHERE status IN (:statuses) ORDER BY createdAt DESC")
    suspend fun getTournamentsByStatuses(statuses: List<TournamentStatus>): List<Tournament>
    
    @Insert
    suspend fun insertTournament(tournament: Tournament): Long
    
    @Update
    suspend fun updateTournament(tournament: Tournament)
    
    @Delete
    suspend fun deleteTournament(tournament: Tournament)
    
    @Query("UPDATE tournaments SET status = :status WHERE id = :tournamentId")
    suspend fun updateTournamentStatus(tournamentId: Long, status: TournamentStatus)
    
    @Query("UPDATE tournaments SET currentPhase = :phase WHERE id = :tournamentId")
    suspend fun updateTournamentPhase(tournamentId: Long, phase: Int)
}