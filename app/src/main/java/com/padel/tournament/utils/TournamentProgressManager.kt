package com.padel.tournament.utils

import com.padel.tournament.data.entities.*
import com.padel.tournament.data.dao.*

class TournamentProgressManager(
    private val tournamentDao: TournamentDao,
    private val matchDao: MatchDao,
    private val tournamentPlayerDao: TournamentPlayerDao
) {
    
    suspend fun checkAndAdvancePhase(tournamentId: Long) {
        val tournament = tournamentDao.getTournamentById(tournamentId) ?: return
        val currentPhaseMatches = matchDao.getMatchesForTournamentPhase(tournamentId, tournament.currentPhase)
        
        // Check if all matches in current phase are completed
        val allMatchesCompleted = currentPhaseMatches.all { it.status == MatchStatus.COMPLETED }
        
        if (!allMatchesCompleted) return
        
        when (tournament.type) {
            TournamentType.ROUND_ROBIN -> {
                // Round robin only has one phase
                finishTournament(tournamentId)
            }
            TournamentType.KNOCKOUT -> {
                // Knockout only has one phase
                finishTournament(tournamentId)
            }
            TournamentType.GROUP_STAGE_KNOCKOUT -> {
                when (tournament.currentPhase) {
                    1 -> {
                        // Advance from group stage to knockout phase
                        generateKnockoutPhase(tournamentId)
                        tournamentDao.updateTournamentPhase(tournamentId, 2)
                        tournamentDao.updateTournamentStatus(tournamentId, TournamentStatus.PHASE_1_COMPLETE)
                    }
                    2 -> {
                        // Knockout phase completed
                        finishTournament(tournamentId)
                    }
                }
            }
        }
    }
    
    private suspend fun generateKnockoutPhase(tournamentId: Long) {
        val groupWinners = getGroupWinners(tournamentId)
        val scheduler = TournamentScheduler()
        val knockoutMatches = scheduler.generateKnockoutFromGroups(tournamentId, groupWinners)
        matchDao.insertMatches(knockoutMatches)
    }
    
    private suspend fun getGroupWinners(tournamentId: Long): List<Pair<Long, Long>> {
        val maxGroupNumber = tournamentPlayerDao.getMaxGroupNumber(tournamentId) ?: return emptyList()
        val groupWinners = mutableListOf<Pair<Long, Long>>()
        
        for (groupNum in 1..maxGroupNumber) {
            val groupMatches = matchDao.getMatchesForGroup(tournamentId, 1, groupNum)
            val groupStandings = calculateGroupStandings(groupMatches)
            
            // Get top 2 teams from each group
            if (groupStandings.size >= 2) {
                val firstPlace = groupStandings[0]
                val secondPlace = groupStandings[1]
                groupWinners.add(firstPlace)
                groupWinners.add(secondPlace)
            }
        }
        
        return groupWinners
    }
    
    private fun calculateGroupStandings(matches: List<Match>): List<Pair<Long, Long>> {
        val teamStats = mutableMapOf<Pair<Long, Long>, TeamStats>()
        
        matches.forEach { match ->
            if (match.status == MatchStatus.COMPLETED && match.winnerTeam != null) {
                val team1 = Pair(match.player1Id, match.player2Id)
                val team2 = Pair(match.player3Id, match.player4Id)
                
                // Initialize team stats if not exists
                teamStats.putIfAbsent(team1, TeamStats())
                teamStats.putIfAbsent(team2, TeamStats())
                
                val team1Stats = teamStats[team1]!!
                val team2Stats = teamStats[team2]!!
                
                // Update matches played
                team1Stats.matchesPlayed++
                team2Stats.matchesPlayed++
                
                // Update wins/losses and points
                if (match.winnerTeam == 1) {
                    team1Stats.matchesWon++
                    team1Stats.points += 2 // 2 points for a win
                    team2Stats.matchesLost++
                } else {
                    team2Stats.matchesWon++
                    team2Stats.points += 2
                    team1Stats.matchesLost++
                }
                
                // Update sets and games
                team1Stats.setsWon += match.team1Score ?: 0
                team1Stats.setsLost += match.team2Score ?: 0
                team2Stats.setsWon += match.team2Score ?: 0
                team2Stats.setsLost += match.team1Score ?: 0
                
                val team1GamesWon = (match.set1Team1 ?: 0) + (match.set2Team1 ?: 0) + (match.set3Team1 ?: 0)
                val team1GamesLost = (match.set1Team2 ?: 0) + (match.set2Team2 ?: 0) + (match.set3Team2 ?: 0)
                
                team1Stats.gamesWon += team1GamesWon
                team1Stats.gamesLost += team1GamesLost
                team2Stats.gamesWon += team1GamesLost
                team2Stats.gamesLost += team1GamesWon
            }
        }
        
        // Sort teams by points, then by set difference, then by game difference
        return teamStats.entries.sortedWith { entry1, entry2 ->
            val stats1 = entry1.value
            val stats2 = entry2.value
            
            when {
                stats1.points != stats2.points -> stats2.points.compareTo(stats1.points)
                stats1.setDifference() != stats2.setDifference() -> 
                    stats2.setDifference().compareTo(stats1.setDifference())
                else -> stats2.gameDifference().compareTo(stats1.gameDifference())
            }
        }.map { it.key }
    }
    
    private suspend fun finishTournament(tournamentId: Long) {
        tournamentDao.updateTournamentStatus(tournamentId, TournamentStatus.FINISHED)
    }
    
    data class TeamStats(
        var matchesPlayed: Int = 0,
        var matchesWon: Int = 0,
        var matchesLost: Int = 0,
        var setsWon: Int = 0,
        var setsLost: Int = 0,
        var gamesWon: Int = 0,
        var gamesLost: Int = 0,
        var points: Int = 0
    ) {
        fun setDifference() = setsWon - setsLost
        fun gameDifference() = gamesWon - gamesLost
    }
}