package com.padel.tournament.data.entities

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "player_stats",
    foreignKeys = [
        ForeignKey(
            entity = Player::class,
            parentColumns = ["id"],
            childColumns = ["playerId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("playerId")]
)
data class PlayerStats(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val playerId: Long,
    val totalMatches: Int = 0,
    val matchesWon: Int = 0,
    val matchesLost: Int = 0,
    val setsWon: Int = 0,
    val setsLost: Int = 0,
    val gamesWon: Int = 0,
    val gamesLost: Int = 0,
    val tournamentsPlayed: Int = 0,
    val tournamentsWon: Int = 0,
    val winPercentage: Double = 0.0,
    val averagePointsPerMatch: Double = 0.0,
    val lastUpdated: Long = System.currentTimeMillis()
)