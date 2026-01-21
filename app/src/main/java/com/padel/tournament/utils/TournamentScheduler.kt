package com.padel.tournament.utils

import com.padel.tournament.data.entities.Match
import kotlin.random.Random

class TournamentScheduler {
    
    fun generateRoundRobinMatches(tournamentId: Long, playerIds: List<Long>): List<Match> {
        val matches = mutableListOf<Match>()
        val teams = createTeams(playerIds)
        var matchNumber = 1
        
        for (i in teams.indices) {
            for (j in i + 1 until teams.size) {
                val team1 = teams[i]
                val team2 = teams[j]
                
                val match = Match(
                    tournamentId = tournamentId,
                    phase = 1,
                    roundNumber = 1,
                    matchNumber = matchNumber++,
                    player1Id = team1.first,
                    player2Id = team1.second,
                    player3Id = team2.first,
                    player4Id = team2.second
                )
                matches.add(match)
            }
        }
        
        return matches
    }
    
    fun generateKnockoutMatches(tournamentId: Long, playerIds: List<Long>): List<Match> {
        val matches = mutableListOf<Match>()
        val teams = createTeams(playerIds)
        val shuffledTeams = teams.shuffled()
        
        var currentRound = 1
        var currentTeams = shuffledTeams
        var matchNumber = 1
        
        while (currentTeams.size > 1) {
            val nextRoundTeams = mutableListOf<Pair<Long, Long>>()
            
            for (i in 0 until currentTeams.size step 2) {
                if (i + 1 < currentTeams.size) {
                    val team1 = currentTeams[i]
                    val team2 = currentTeams[i + 1]
                    
                    val match = Match(
                        tournamentId = tournamentId,
                        phase = 1,
                        roundNumber = currentRound,
                        matchNumber = matchNumber++,
                        player1Id = team1.first,
                        player2Id = team1.second,
                        player3Id = team2.first,
                        player4Id = team2.second
                    )
                    matches.add(match)
                    
                    nextRoundTeams.add(team1)
                }
            }
            
            currentTeams = nextRoundTeams
            currentRound++
        }
        
        return matches
    }
    
    fun generateGroupStageMatches(tournamentId: Long, playerIds: List<Long>): List<Match> {
        val matches = mutableListOf<Match>()
        val teams = createTeams(playerIds)
        val numGroups = maxOf(2, teams.size / 4)
        val groups = distributeTeamsIntoGroups(teams, numGroups)
        
        var matchNumber = 1
        
        groups.forEachIndexed { groupIndex, groupTeams ->
            for (i in groupTeams.indices) {
                for (j in i + 1 until groupTeams.size) {
                    val team1 = groupTeams[i]
                    val team2 = groupTeams[j]
                    
                    val match = Match(
                        tournamentId = tournamentId,
                        phase = 1,
                        roundNumber = 1,
                        matchNumber = matchNumber++,
                        player1Id = team1.first,
                        player2Id = team1.second,
                        player3Id = team2.first,
                        player4Id = team2.second,
                        groupNumber = groupIndex + 1
                    )
                    matches.add(match)
                }
            }
        }
        
        return matches
    }
    
    fun generateKnockoutFromGroups(
        tournamentId: Long,
        groupWinners: List<Pair<Long, Long>>
    ): List<Match> {
        return generateKnockoutMatches(tournamentId, groupWinners.flatMap { listOf(it.first, it.second) })
            .map { it.copy(phase = 2) }
    }
    
    private fun createTeams(playerIds: List<Long>): List<Pair<Long, Long>> {
        val shuffledPlayers = playerIds.shuffled()
        val teams = mutableListOf<Pair<Long, Long>>()
        
        for (i in 0 until shuffledPlayers.size step 2) {
            if (i + 1 < shuffledPlayers.size) {
                teams.add(Pair(shuffledPlayers[i], shuffledPlayers[i + 1]))
            }
        }
        
        return teams
    }
    
    private fun distributeTeamsIntoGroups(
        teams: List<Pair<Long, Long>>,
        numGroups: Int
    ): List<List<Pair<Long, Long>>> {
        val groups = List(numGroups) { mutableListOf<Pair<Long, Long>>() }
        
        teams.forEachIndexed { index, team ->
            groups[index % numGroups].add(team)
        }
        
        return groups
    }
}