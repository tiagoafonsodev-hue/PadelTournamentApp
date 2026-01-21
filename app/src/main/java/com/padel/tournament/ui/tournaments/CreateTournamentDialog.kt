package com.padel.tournament.ui.tournaments

import android.app.Dialog
import android.os.Bundle
import android.widget.Toast
import androidx.fragment.app.DialogFragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.padel.tournament.R
import com.padel.tournament.data.entities.Player
import com.padel.tournament.data.entities.TournamentType
import com.padel.tournament.databinding.DialogCreateTournamentBinding
import com.padel.tournament.viewmodel.PlayerViewModel

class CreateTournamentDialog : DialogFragment() {

    private var _binding: DialogCreateTournamentBinding? = null
    private val binding get() = _binding!!

    private val playerViewModel: PlayerViewModel by viewModels()
    private lateinit var playerSelectionAdapter: PlayerSelectionAdapter
    private var onCreateCallback: ((String, TournamentType, List<Long>) -> Unit)? = null

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        _binding = DialogCreateTournamentBinding.inflate(layoutInflater)
        
        setupPlayerSelection()
        setupObservers()
        
        return MaterialAlertDialogBuilder(requireContext())
            .setTitle("Create Tournament")
            .setView(binding.root)
            .setPositiveButton("Create") { _, _ ->
                createTournament()
            }
            .setNegativeButton(R.string.cancel, null)
            .create()
    }

    private fun setupPlayerSelection() {
        playerSelectionAdapter = PlayerSelectionAdapter { selectedCount ->
            binding.selectedPlayersCount.text = "$selectedCount players selected"
        }
        
        binding.playersSelectionRecycler.apply {
            adapter = playerSelectionAdapter
            layoutManager = LinearLayoutManager(requireContext())
        }
    }

    private fun setupObservers() {
        playerViewModel.allPlayers.observe(this) { players ->
            playerSelectionAdapter.submitList(players)
        }
    }

    private fun createTournament() {
        val name = binding.editTextTournamentName.text.toString().trim()
        val selectedPlayers = playerSelectionAdapter.getSelectedPlayers()
        
        if (name.isEmpty()) {
            Toast.makeText(context, "Please enter a tournament name", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (selectedPlayers.size < 4) {
            Toast.makeText(context, "Please select at least 4 players", Toast.LENGTH_SHORT).show()
            return
        }
        
        if (selectedPlayers.size % 4 != 0) {
            Toast.makeText(context, "Number of players must be divisible by 4", Toast.LENGTH_SHORT).show()
            return
        }
        
        val type = when (binding.radioGroupTournamentType.checkedRadioButtonId) {
            R.id.radio_round_robin -> TournamentType.ROUND_ROBIN
            R.id.radio_knockout -> TournamentType.KNOCKOUT
            R.id.radio_group_stage -> TournamentType.GROUP_STAGE_KNOCKOUT
            else -> TournamentType.ROUND_ROBIN
        }
        
        onCreateCallback?.invoke(name, type, selectedPlayers)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        fun newInstance(
            onCreate: (String, TournamentType, List<Long>) -> Unit
        ): CreateTournamentDialog {
            return CreateTournamentDialog().apply {
                onCreateCallback = onCreate
            }
        }
    }
}