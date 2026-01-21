package com.padel.tournament.data.database

import androidx.room.TypeConverter
import com.padel.tournament.data.entities.TournamentType
import com.padel.tournament.data.entities.TournamentStatus
import com.padel.tournament.data.entities.MatchStatus

class Converters {
    
    @TypeConverter
    fun fromTournamentType(type: TournamentType): String {
        return type.name
    }
    
    @TypeConverter
    fun toTournamentType(type: String): TournamentType {
        return TournamentType.valueOf(type)
    }
    
    @TypeConverter
    fun fromTournamentStatus(status: TournamentStatus): String {
        return status.name
    }
    
    @TypeConverter
    fun toTournamentStatus(status: String): TournamentStatus {
        return TournamentStatus.valueOf(status)
    }
    
    @TypeConverter
    fun fromMatchStatus(status: MatchStatus): String {
        return status.name
    }
    
    @TypeConverter
    fun toMatchStatus(status: String): MatchStatus {
        return MatchStatus.valueOf(status)
    }
}