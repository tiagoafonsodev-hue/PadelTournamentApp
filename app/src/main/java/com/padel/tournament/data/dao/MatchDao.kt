package com.padel.tournament.data.dao

import androidx.lifecycle.LiveData
import androidx.room.*
import com.padel.tournament.data.entities.Match
import com.padel.tournament.data.entities.MatchStatus

@Dao
interface MatchDao {
    
    @Query("SELECT * FROM matches WHERE tournamentId = :tournamentId ORDER BY phase, roundNumber, matchNumber")
    fun getMatchesForTournament(tournamentId: Long): LiveData<List<Match>>
    
    @Query("SELECT * FROM matches WHERE tournamentId = :tournamentId AND phase = :phase ORDER BY roundNumber, matchNumber")
    suspend fun getMatchesForTournamentPhase(tournamentId: Long, phase: Int): List<Match>
    
    @Query("SELECT * FROM matches WHERE tournamentId = :tournamentId AND phase = :phase AND groupNumber = :groupNumber ORDER BY roundNumber, matchNumber")
    suspend fun getMatchesForGroup(tournamentId: Long, phase: Int, groupNumber: Int): List<Match>
    
    @Query("SELECT * FROM matches WHERE id = :matchId")
    suspend fun getMatchById(matchId: Long): Match?
    
    @Query("SELECT * FROM matches WHERE (player1Id = :playerId OR player2Id = :playerId OR player3Id = :playerId OR player4Id = :playerId) AND status = :status")
    suspend fun getMatchesForPlayer(playerId: Long, status: MatchStatus): List<Match>
    
    @Query("SELECT * FROM matches WHERE tournamentId = :tournamentId AND status = :status")
    suspend fun getMatchesByStatus(tournamentId: Long, status: MatchStatus): List<Match>
    
    @Insert
    suspend fun insertMatch(match: Match): Long
    
    @Insert
    suspend fun insertMatches(matches: List<Match>)
    
    @Update
    suspend fun updateMatch(match: Match)
    
    @Delete
    suspend fun deleteMatch(match: Match)
    
    @Query("DELETE FROM matches WHERE tournamentId = :tournamentId AND phase = :phase")
    suspend fun deleteMatchesForPhase(tournamentId: Long, phase: Int)
    
    @Query("UPDATE matches SET status = :status WHERE id = :matchId")
    suspend fun updateMatchStatus(matchId: Long, status: MatchStatus)
}