package com.padel.tournament.ui.players

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.padel.tournament.databinding.FragmentPlayerListBinding
import com.padel.tournament.data.entities.Player
import com.padel.tournament.viewmodel.PlayerViewModel

class PlayerListFragment : Fragment() {

    private var _binding: FragmentPlayerListBinding? = null
    private val binding get() = _binding!!

    private val viewModel: PlayerViewModel by viewModels()
    private lateinit var playerAdapter: PlayerAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentPlayerListBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupRecyclerView()
        setupObservers()
        setupClickListeners()
        setupSearch()
    }

    private fun setupRecyclerView() {
        playerAdapter = PlayerAdapter(
            onEditClick = { player -> showEditPlayerDialog(player) },
            onDeleteClick = { player -> showDeleteConfirmation(player) }
        )
        
        binding.playersRecyclerView.apply {
            adapter = playerAdapter
            layoutManager = LinearLayoutManager(requireContext())
        }
    }

    private fun setupObservers() {
        viewModel.allPlayers.observe(viewLifecycleOwner) { players ->
            if (binding.searchEditText.text.isNullOrEmpty()) {
                playerAdapter.submitList(players)
            }
        }

        viewModel.searchResults.observe(viewLifecycleOwner) { players ->
            if (!binding.searchEditText.text.isNullOrEmpty()) {
                playerAdapter.submitList(players)
            }
        }

        viewModel.isLoading.observe(viewLifecycleOwner) { isLoading ->
            binding.progressBar.visibility = if (isLoading) View.VISIBLE else View.GONE
        }

        viewModel.error.observe(viewLifecycleOwner) { error ->
            error?.let {
                Toast.makeText(requireContext(), it, Toast.LENGTH_LONG).show()
                viewModel.clearError()
            }
        }
    }

    private fun setupClickListeners() {
        binding.fabAddPlayer.setOnClickListener {
            showAddPlayerDialog()
        }
    }

    private fun setupSearch() {
        binding.searchEditText.doAfterTextChanged { text ->
            val query = text.toString().trim()
            if (query.isEmpty()) {
                viewModel.allPlayers.value?.let { players ->
                    playerAdapter.submitList(players)
                }
            } else {
                viewModel.searchPlayers(query)
            }
        }
    }

    private fun showAddPlayerDialog() {
        AddEditPlayerDialog.newInstance { name, email, phone ->
            viewModel.insertPlayer(name, email, phone)
        }.show(parentFragmentManager, "AddPlayerDialog")
    }

    private fun showEditPlayerDialog(player: Player) {
        AddEditPlayerDialog.newInstance(
            player = player,
            onSave = { name, email, phone ->
                val updatedPlayer = player.copy(
                    name = name,
                    email = email.takeIf { it.isNotBlank() },
                    phoneNumber = phone.takeIf { it.isNotBlank() }
                )
                viewModel.updatePlayer(updatedPlayer)
            }
        ).show(parentFragmentManager, "EditPlayerDialog")
    }

    private fun showDeleteConfirmation(player: Player) {
        MaterialAlertDialogBuilder(requireContext())
            .setTitle("Delete Player")
            .setMessage("Are you sure you want to delete ${player.name}?")
            .setPositiveButton("Delete") { _, _ ->
                viewModel.deletePlayer(player)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}