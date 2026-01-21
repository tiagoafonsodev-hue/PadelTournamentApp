package com.padel.tournament.ui.tournaments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.recyclerview.widget.LinearLayoutManager
import com.padel.tournament.databinding.FragmentTournamentListBinding
import com.padel.tournament.data.entities.Tournament
import com.padel.tournament.viewmodel.TournamentViewModel

class TournamentListFragment : Fragment() {

    private var _binding: FragmentTournamentListBinding? = null
    private val binding get() = _binding!!

    private val viewModel: TournamentViewModel by viewModels()
    private lateinit var tournamentAdapter: TournamentAdapter

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentTournamentListBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupRecyclerView()
        setupObservers()
        setupClickListeners()
    }

    private fun setupRecyclerView() {
        tournamentAdapter = TournamentAdapter(
            onViewClick = { tournament -> 
                // TODO: Navigate to tournament detail
                Toast.makeText(context, "View ${tournament.name}", Toast.LENGTH_SHORT).show()
            },
            onManageClick = { tournament -> 
                // TODO: Navigate to tournament management
                Toast.makeText(context, "Manage ${tournament.name}", Toast.LENGTH_SHORT).show()
            }
        )
        
        binding.tournamentsRecyclerView.apply {
            adapter = tournamentAdapter
            layoutManager = LinearLayoutManager(requireContext())
        }
    }

    private fun setupObservers() {
        viewModel.allTournaments.observe(viewLifecycleOwner) { tournaments ->
            tournamentAdapter.submitList(tournaments)
            
            if (tournaments.isEmpty()) {
                binding.tournamentsRecyclerView.visibility = View.GONE
                binding.emptyStateText.visibility = View.VISIBLE
            } else {
                binding.tournamentsRecyclerView.visibility = View.VISIBLE
                binding.emptyStateText.visibility = View.GONE
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

        viewModel.tournamentCreated.observe(viewLifecycleOwner) { tournamentId ->
            tournamentId?.let {
                Toast.makeText(requireContext(), "Tournament created successfully!", Toast.LENGTH_SHORT).show()
                viewModel.clearTournamentCreated()
            }
        }
    }

    private fun setupClickListeners() {
        binding.fabCreateTournament.setOnClickListener {
            showCreateTournamentDialog()
        }
    }

    private fun showCreateTournamentDialog() {
        // Navigate to step-by-step tournament creation
        parentFragmentManager.beginTransaction()
            .replace(this.id, CreateTournamentStep1Fragment())
            .addToBackStack(null)
            .commit()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}