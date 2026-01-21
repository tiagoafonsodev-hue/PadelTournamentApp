package com.padel.tournament.ui.matches

import android.app.Dialog
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.core.os.bundleOf
import androidx.fragment.app.DialogFragment
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.padel.tournament.R
import com.padel.tournament.data.entities.Match
import com.padel.tournament.data.entities.Player
import com.padel.tournament.databinding.DialogMatchResultBinding

class MatchResultDialog : DialogFragment() {

    private var _binding: DialogMatchResultBinding? = null
    private val binding get() = _binding!!

    private var match: Match? = null
    private var players: List<Player> = emptyList()
    private var onSaveCallback: ((Match) -> Unit)? = null
    private var isSet3Visible = false

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        _binding = DialogMatchResultBinding.inflate(layoutInflater)
        
        match = arguments?.getSerializable(ARG_MATCH) as? Match
        players = (arguments?.getSerializable(ARG_PLAYERS) as? ArrayList<Player>) ?: emptyList()
        
        setupViews()
        setupClickListeners()
        
        return MaterialAlertDialogBuilder(requireContext())
            .setTitle("Match Result")
            .setView(binding.root)
            .setPositiveButton(R.string.save) { _, _ ->
                saveMatchResult()
            }
            .setNegativeButton(R.string.cancel, null)
            .create()
    }

    private fun setupViews() {
        match?.let { match ->
            val player1 = players.find { it.id == match.player1Id }?.name ?: "Player 1"
            val player2 = players.find { it.id == match.player2Id }?.name ?: "Player 2"
            val player3 = players.find { it.id == match.player3Id }?.name ?: "Player 3"
            val player4 = players.find { it.id == match.player4Id }?.name ?: "Player 4"
            
            binding.team1Players.text = "$player1 & $player2"
            binding.team2Players.text = "$player3 & $player4"
            
            // Pre-fill existing scores if match has been played
            match.set1Team1?.let { binding.set1Team1Score.setText(it.toString()) }
            match.set1Team2?.let { binding.set1Team2Score.setText(it.toString()) }
            match.set2Team1?.let { binding.set2Team1Score.setText(it.toString()) }
            match.set2Team2?.let { binding.set2Team2Score.setText(it.toString()) }
            
            if (match.set3Team1 != null || match.set3Team2 != null) {
                showSet3()
                match.set3Team1?.let { binding.set3Team1Score.setText(it.toString()) }
                match.set3Team2?.let { binding.set3Team2Score.setText(it.toString()) }
            }
            
            match.winnerTeam?.let { winner ->
                when (winner) {
                    1 -> binding.team1Winner.isChecked = true
                    2 -> binding.team2Winner.isChecked = true
                }
            }
        }
    }

    private fun setupClickListeners() {
        binding.btnAddSet3.setOnClickListener {
            if (isSet3Visible) {
                hideSet3()
            } else {
                showSet3()
            }
        }
    }

    private fun showSet3() {
        binding.set3Layout.visibility = View.VISIBLE
        binding.btnAddSet3.text = "Remove 3rd Set"
        isSet3Visible = true
    }

    private fun hideSet3() {
        binding.set3Layout.visibility = View.GONE
        binding.btnAddSet3.text = "Add 3rd Set"
        binding.set3Team1Score.setText("")
        binding.set3Team2Score.setText("")
        isSet3Visible = false
    }

    private fun saveMatchResult() {
        val currentMatch = match ?: return
        
        // Validate winner selection
        val winnerTeam = when (binding.winnerRadioGroup.checkedRadioButtonId) {
            R.id.team1_winner -> 1
            R.id.team2_winner -> 2
            else -> {
                Toast.makeText(context, "Please select the winning team", Toast.LENGTH_SHORT).show()
                return
            }
        }
        
        // Get set scores
        val set1Team1 = binding.set1Team1Score.text.toString().toIntOrNull()
        val set1Team2 = binding.set1Team2Score.text.toString().toIntOrNull()
        val set2Team1 = binding.set2Team1Score.text.toString().toIntOrNull()
        val set2Team2 = binding.set2Team2Score.text.toString().toIntOrNull()
        
        if (set1Team1 == null || set1Team2 == null || set2Team1 == null || set2Team2 == null) {
            Toast.makeText(context, "Please enter scores for sets 1 and 2", Toast.LENGTH_SHORT).show()
            return
        }
        
        var set3Team1: Int? = null
        var set3Team2: Int? = null
        
        if (isSet3Visible) {
            set3Team1 = binding.set3Team1Score.text.toString().toIntOrNull()
            set3Team2 = binding.set3Team2Score.text.toString().toIntOrNull()
            
            if (set3Team1 == null || set3Team2 == null) {
                Toast.makeText(context, "Please enter scores for set 3 or remove it", Toast.LENGTH_SHORT).show()
                return
            }
        }
        
        // Calculate team scores (sets won)
        var team1Score = 0
        var team2Score = 0
        
        if (set1Team1 > set1Team2) team1Score++ else team2Score++
        if (set2Team1 > set2Team2) team1Score++ else team2Score++
        if (set3Team1 != null && set3Team2 != null) {
            if (set3Team1 > set3Team2) team1Score++ else team2Score++
        }
        
        // Validate that the winner actually won more sets
        if ((winnerTeam == 1 && team1Score <= team2Score) || (winnerTeam == 2 && team2Score <= team1Score)) {
            Toast.makeText(context, "Winner team must win more sets", Toast.LENGTH_LONG).show()
            return
        }
        
        val updatedMatch = currentMatch.copy(
            team1Score = team1Score,
            team2Score = team2Score,
            set1Team1 = set1Team1,
            set1Team2 = set1Team2,
            set2Team1 = set2Team1,
            set2Team2 = set2Team2,
            set3Team1 = set3Team1,
            set3Team2 = set3Team2,
            winnerTeam = winnerTeam,
            status = com.padel.tournament.data.entities.MatchStatus.COMPLETED,
            playedAt = System.currentTimeMillis()
        )
        
        onSaveCallback?.invoke(updatedMatch)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        private const val ARG_MATCH = "match"
        private const val ARG_PLAYERS = "players"

        fun newInstance(
            match: Match,
            players: List<Player>,
            onSave: (Match) -> Unit
        ): MatchResultDialog {
            return MatchResultDialog().apply {
                arguments = bundleOf(
                    ARG_MATCH to match,
                    ARG_PLAYERS to ArrayList(players)
                )
                onSaveCallback = onSave
            }
        }
    }
}