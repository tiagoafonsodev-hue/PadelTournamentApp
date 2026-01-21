package com.padel.tournament.ui.players

import android.app.Dialog
import android.os.Bundle
import androidx.appcompat.app.AlertDialog
import androidx.core.os.bundleOf
import androidx.fragment.app.DialogFragment
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputLayout
import com.padel.tournament.R
import com.padel.tournament.data.entities.Player
import com.padel.tournament.databinding.DialogAddEditPlayerBinding

class AddEditPlayerDialog : DialogFragment() {

    private var _binding: DialogAddEditPlayerBinding? = null
    private val binding get() = _binding!!

    private var player: Player? = null
    private var onSaveCallback: ((String, String, String) -> Unit)? = null

    override fun onCreateDialog(savedInstanceState: Bundle?): Dialog {
        _binding = DialogAddEditPlayerBinding.inflate(layoutInflater)
        
        try {
            player = arguments?.getSerializable(ARG_PLAYER) as? Player
        } catch (e: Exception) {
            // Handle serialization error gracefully
            player = null
        }
        
        setupViews()
        
        return MaterialAlertDialogBuilder(requireContext())
            .setTitle(if (player != null) "Edit Player" else "Add Player")
            .setView(binding.root)
            .setPositiveButton(R.string.save) { _, _ ->
                savePlayer()
            }
            .setNegativeButton(R.string.cancel, null)
            .create()
    }

    private fun setupViews() {
        player?.let { player ->
            binding.editTextName.setText(player.name)
            binding.editTextEmail.setText(player.email ?: "")
            binding.editTextPhone.setText(player.phoneNumber ?: "")
        }
    }

    private fun savePlayer() {
        val name = binding.editTextName.text.toString().trim()
        val email = binding.editTextEmail.text.toString().trim()
        val phone = binding.editTextPhone.text.toString().trim()

        // Clear any previous errors
        binding.editTextName.error = null

        if (name.isEmpty()) {
            binding.editTextName.error = "Name is required"
            return
        }

        onSaveCallback?.invoke(name, email, phone)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    companion object {
        private const val ARG_PLAYER = "player"

        fun newInstance(
            player: Player? = null,
            onSave: (String, String, String) -> Unit
        ): AddEditPlayerDialog {
            return AddEditPlayerDialog().apply {
                arguments = bundleOf(ARG_PLAYER to player)
                onSaveCallback = onSave
            }
        }
    }
}