package com.padel.tournament.data.entities

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tournaments")
data class Tournament(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val type: TournamentType,
    val status: TournamentStatus = TournamentStatus.CREATED,
    val currentPhase: Int = 1,
    val maxPhases: Int = 1,
    val createdAt: Long = System.currentTimeMillis(),
    val startedAt: Long? = null,
    val finishedAt: Long? = null
)

enum class TournamentType {
    ROUND_ROBIN,
    KNOCKOUT,
    GROUP_STAGE_KNOCKOUT
}

enum class TournamentStatus {
    CREATED,
    IN_PROGRESS,
    PHASE_1_COMPLETE,
    PHASE_2_COMPLETE,
    FINISHED
}