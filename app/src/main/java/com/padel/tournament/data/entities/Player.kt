package com.padel.tournament.data.entities

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.io.Serializable

@Entity(tableName = "players")
data class Player(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val name: String,
    val email: String? = null,
    val phoneNumber: String? = null,
    val createdAt: Long = System.currentTimeMillis()
) : Serializable