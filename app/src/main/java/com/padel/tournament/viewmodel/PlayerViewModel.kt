package com.padel.tournament.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.launch
import com.padel.tournament.data.database.PadelDatabase
import com.padel.tournament.data.entities.Player
import com.padel.tournament.repository.PlayerRepository

class PlayerViewModel(application: Application) : AndroidViewModel(application) {
    
    private val repository: PlayerRepository
    val allPlayers: LiveData<List<Player>>
    
    private val _searchResults = MutableLiveData<List<Player>>()
    val searchResults: LiveData<List<Player>> = _searchResults
    
    private val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    private val _error = MutableLiveData<String?>()
    val error: LiveData<String?> = _error
    
    init {
        val database = PadelDatabase.getDatabase(application)
        repository = PlayerRepository(database.playerDao(), database.playerStatsDao())
        allPlayers = repository.getAllPlayers()
    }
    
    fun insertPlayer(name: String, email: String? = null, phoneNumber: String? = null) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null
                
                if (name.isBlank()) {
                    _error.value = "Player name cannot be empty"
                    return@launch
                }
                
                val player = Player(
                    name = name.trim(),
                    email = email?.takeIf { it.isNotBlank() },
                    phoneNumber = phoneNumber?.takeIf { it.isNotBlank() }
                )
                repository.insertPlayer(player)
            } catch (e: Exception) {
                _error.value = "Failed to add player: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun updatePlayer(player: Player) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null
                repository.updatePlayer(player)
            } catch (e: Exception) {
                _error.value = "Failed to update player: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun deletePlayer(player: Player) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null
                repository.deletePlayer(player)
            } catch (e: Exception) {
                _error.value = "Failed to delete player: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun searchPlayers(query: String) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null
                val results = repository.searchPlayers(query)
                _searchResults.value = results
            } catch (e: Exception) {
                _error.value = "Search failed: ${e.message}"
                _searchResults.value = emptyList()
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun clearError() {
        _error.value = null
    }
}