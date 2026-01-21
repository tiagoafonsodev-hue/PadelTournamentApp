package com.padel.tournament.repository

import androidx.lifecycle.LiveData
import com.padel.tournament.data.dao.TournamentDao
import com.padel.tournament.data.dao.TournamentPlayerDao
import com.padel.tournament.data.dao.MatchDao
import com.padel.tournament.data.entities.Tournament
import com.padel.tournament.data.entities.TournamentPlayer
import com.padel.tournament.data.entities.Match
import com.padel.tournament.data.entities.TournamentStatus

class TournamentRepository(
    private val tournamentDao: TournamentDao,
    private val tournamentPlayerDao: TournamentPlayerDao,
    private val matchDao: MatchDao
) {
    
    fun getAllTournaments(): LiveData<List<Tournament>> = tournamentDao.getAllTournaments()
    
    suspend fun getTournamentById(tournamentId: Long): Tournament? = 
        tournamentDao.getTournamentById(tournamentId)
    
    suspend fun insertTournament(tournament: Tournament): Long = 
        tournamentDao.insertTournament(tournament)
    
    suspend fun updateTournament(tournament: Tournament) = 
        tournamentDao.updateTournament(tournament)
    
    suspend fun deleteTournament(tournament: Tournament) = 
        tournamentDao.deleteTournament(tournament)
    
    suspend fun addPlayersToTournament(tournamentId: Long, playerIds: List<Long>) {
        val tournamentPlayers = playerIds.map { playerId ->
            TournamentPlayer(tournamentId = tournamentId, playerId = playerId)
        }
        tournamentPlayerDao.insertTournamentPlayers(tournamentPlayers)
    }
    
    suspend fun getPlayersForTournament(tournamentId: Long): List<TournamentPlayer> = 
        tournamentPlayerDao.getPlayersForTournament(tournamentId)
    
    fun getMatchesForTournament(tournamentId: Long): LiveData<List<Match>> = 
        matchDao.getMatchesForTournament(tournamentId)
    
    suspend fun insertMatches(matches: List<Match>) = 
        matchDao.insertMatches(matches)
    
    suspend fun updateTournamentStatus(tournamentId: Long, status: TournamentStatus) = 
        tournamentDao.updateTournamentStatus(tournamentId, status)
}