package com.padel.tournament.data.entities

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import java.io.Serializable

@Entity(
    tableName = "matches",
    foreignKeys = [
        ForeignKey(
            entity = Tournament::class,
            parentColumns = ["id"],
            childColumns = ["tournamentId"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = Player::class,
            parentColumns = ["id"],
            childColumns = ["player1Id"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = Player::class,
            parentColumns = ["id"],
            childColumns = ["player2Id"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = Player::class,
            parentColumns = ["id"],
            childColumns = ["player3Id"],
            onDelete = ForeignKey.CASCADE
        ),
        ForeignKey(
            entity = Player::class,
            parentColumns = ["id"],
            childColumns = ["player4Id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("tournamentId"), Index("player1Id"), Index("player2Id"), Index("player3Id"), Index("player4Id")]
)
data class Match(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val tournamentId: Long,
    val phase: Int,
    val roundNumber: Int,
    val matchNumber: Int,
    val player1Id: Long,
    val player2Id: Long,
    val player3Id: Long,
    val player4Id: Long,
    val team1Score: Int? = null,
    val team2Score: Int? = null,
    val set1Team1: Int? = null,
    val set1Team2: Int? = null,
    val set2Team1: Int? = null,
    val set2Team2: Int? = null,
    val set3Team1: Int? = null,
    val set3Team2: Int? = null,
    val winnerTeam: Int? = null,
    val status: MatchStatus = MatchStatus.SCHEDULED,
    val groupNumber: Int? = null,
    val scheduledAt: Long? = null,
    val playedAt: Long? = null
) : Serializable

enum class MatchStatus : Serializable {
    SCHEDULED,
    IN_PROGRESS,
    COMPLETED,
    CANCELLED
}