package com.padel.tournament.ui.tournaments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.activityViewModels
import com.padel.tournament.data.entities.TournamentType
import com.padel.tournament.databinding.FragmentCreateTournamentStep1Binding
import com.padel.tournament.viewmodel.TournamentCreationViewModel

class CreateTournamentStep1Fragment : Fragment() {

    private var _binding: FragmentCreateTournamentStep1Binding? = null
    private val binding get() = _binding!!

    private val viewModel: TournamentCreationViewModel by activityViewModels()

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCreateTournamentStep1Binding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        setupUI()
        setupClickListeners()
    }

    private fun setupUI() {
        // Pre-fill if we're coming back from step 2
        viewModel.tournamentName.value?.let {
            binding.editTextTournamentName.setText(it)
        }
        
        when (viewModel.tournamentType.value) {
            TournamentType.ROUND_ROBIN -> binding.radioRoundRobin.isChecked = true
            TournamentType.KNOCKOUT -> binding.radioKnockout.isChecked = true
            TournamentType.GROUP_STAGE_KNOCKOUT -> binding.radioGroupStage.isChecked = true
            else -> binding.radioRoundRobin.isChecked = true
        }
    }

    private fun setupClickListeners() {
        // Card clicks should select the radio button
        binding.cardRoundRobin.setOnClickListener {
            binding.radioRoundRobin.isChecked = true
        }
        
        binding.cardKnockout.setOnClickListener {
            binding.radioKnockout.isChecked = true
        }
        
        binding.cardGroupStage.setOnClickListener {
            binding.radioGroupStage.isChecked = true
        }

        binding.btnNextStep.setOnClickListener {
            validateAndProceed()
        }
    }

    private fun validateAndProceed() {
        val name = binding.editTextTournamentName.text.toString().trim()
        
        if (name.isEmpty()) {
            binding.editTextTournamentName.error = "Tournament name is required"
            return
        }
        
        val type = when {
            binding.radioRoundRobin.isChecked -> TournamentType.ROUND_ROBIN
            binding.radioKnockout.isChecked -> TournamentType.KNOCKOUT
            binding.radioGroupStage.isChecked -> TournamentType.GROUP_STAGE_KNOCKOUT
            else -> TournamentType.ROUND_ROBIN
        }

        // Save to shared ViewModel
        viewModel.setTournamentName(name)
        viewModel.setTournamentType(type)

        // Navigate to step 2
        parentFragmentManager.beginTransaction()
            .replace(this@CreateTournamentStep1Fragment.id, CreateTournamentStep2Fragment())
            .addToBackStack(null)
            .commit()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}