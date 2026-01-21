package com.padel.tournament.ui.tournaments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.padel.tournament.data.entities.TournamentType
import com.padel.tournament.databinding.FragmentCreateTournamentStep2Binding
import com.padel.tournament.viewmodel.PlayerViewModel
import com.padel.tournament.viewmodel.TournamentCreationViewModel

class CreateTournamentStep2Fragment : Fragment() {

    private var _binding: FragmentCreateTournamentStep2Binding? = null
    private val binding get() = _binding!!

    private val creationViewModel: TournamentCreationViewModel by activityViewModels()
    private val playerViewModel: PlayerViewModel by viewModels()
    private lateinit var playerSelectionAdapter: TournamentPlayerSelectionAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCreateTournamentStep2Binding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupUI()
        setupRecyclerView()
        setupObservers()
        setupClickListeners()
        setupSearch()
    }

    private fun setupUI() {
        binding.tournamentNameHeader.text = creationViewModel.tournamentName.value ?: "Tournament"
        
        val typeText = when (creationViewModel.tournamentType.value) {
            TournamentType.ROUND_ROBIN -> "Round Robin Tournament"
            TournamentType.KNOCKOUT -> "Knockout Tournament"  
            TournamentType.GROUP_STAGE_KNOCKOUT -> "Group Stage + Knockout Tournament"
            else -> "Tournament"
        }
        binding.tournamentTypeHeader.text = typeText
        
        updateSelectedCount()
    }

    private fun setupRecyclerView() {
        playerSelectionAdapter = TournamentPlayerSelectionAdapter(
            onPlayerToggle = { player ->
                creationViewModel.togglePlayerSelection(player.id)
                updateSelectedCount()
                updateCreateButton()
            },
            isPlayerSelected = { playerId ->
                creationViewModel.isPlayerSelected(playerId)
            }
        )
        
        binding.playersRecyclerView.apply {
            adapter = playerSelectionAdapter
            layoutManager = LinearLayoutManager(requireContext())
        }
    }

    private fun setupObservers() {
        playerViewModel.allPlayers.observe(viewLifecycleOwner) { players ->
            if (binding.searchPlayers.text.isNullOrEmpty()) {
                playerSelectionAdapter.submitList(players)
            }
        }

        playerViewModel.searchResults.observe(viewLifecycleOwner) { players ->
            if (!binding.searchPlayers.text.isNullOrEmpty()) {
                playerSelectionAdapter.submitList(players)
            }
        }

        creationViewModel.selectedPlayers.observe(viewLifecycleOwner) {
            updateSelectedCount()
            updateCreateButton()
            playerSelectionAdapter.notifyDataSetChanged() // Refresh selection state
        }

        creationViewModel.isLoading.observe(viewLifecycleOwner) { isLoading ->
            binding.btnCreateTournament.isEnabled = !isLoading && creationViewModel.isValidPlayerCount()
            binding.btnCreateTournament.text = if (isLoading) "Creating..." else "Create Tournament"
        }

        creationViewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                Toast.makeText(requireContext(), it, Toast.LENGTH_LONG).show()
                creationViewModel.clearError()
            }
        }

        creationViewModel.tournamentCreated.observe(viewLifecycleOwner) { tournamentId ->
            tournamentId?.let {
                Toast.makeText(requireContext(), "Tournament created successfully!", Toast.LENGTH_SHORT).show()
                
                // Navigate back to tournament list
                parentFragmentManager.popBackStack()
                parentFragmentManager.popBackStack()
            }
        }
    }

    private fun setupClickListeners() {
        binding.btnBack.setOnClickListener {
            parentFragmentManager.popBackStack()
        }

        binding.btnCreateTournament.setOnClickListener {
            creationViewModel.createTournament()
        }
    }

    private fun setupSearch() {
        binding.searchPlayers.doAfterTextChanged { text ->
            val query = text.toString().trim()
            if (query.isEmpty()) {
                playerViewModel.allPlayers.value?.let { players ->
                    playerSelectionAdapter.submitList(players)
                }
            } else {
                playerViewModel.searchPlayers(query)
            }
        }
    }

    private fun updateSelectedCount() {
        val selected = creationViewModel.getSelectedPlayerCount()
        val required = creationViewModel.getRequiredPlayerCount()
        binding.selectedCount.text = "$selected selected (need: $required)"
    }

    private fun updateCreateButton() {
        val isValid = creationViewModel.isValidPlayerCount()
        binding.btnCreateTournament.isEnabled = isValid
        
        if (!isValid && creationViewModel.getSelectedPlayerCount() > 0) {
            val type = creationViewModel.tournamentType.value?.name ?: "this tournament"
            Toast.makeText(requireContext(), 
                "Invalid number of players for $type", 
                Toast.LENGTH_SHORT).show()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}