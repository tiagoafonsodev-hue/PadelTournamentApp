package com.padel.tournament.data.database

import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import android.content.Context
import com.padel.tournament.data.dao.*
import com.padel.tournament.data.entities.*

@Database(
    entities = [
        Player::class,
        Tournament::class,
        TournamentPlayer::class,
        Match::class,
        PlayerStats::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class PadelDatabase : RoomDatabase() {
    
    abstract fun playerDao(): PlayerDao
    abstract fun tournamentDao(): TournamentDao
    abstract fun tournamentPlayerDao(): TournamentPlayerDao
    abstract fun matchDao(): MatchDao
    abstract fun playerStatsDao(): PlayerStatsDao
    
    companion object {
        @Volatile
        private var INSTANCE: PadelDatabase? = null
        
        fun getDatabase(context: Context): PadelDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    PadelDatabase::class.java,
                    "padel_database"
                )
                    .fallbackToDestructiveMigration()
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}