package com.padel.tournament.ui.tournaments

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.chip.Chip
import com.padel.tournament.R
import com.padel.tournament.data.entities.Tournament
import com.padel.tournament.data.entities.TournamentStatus
import com.padel.tournament.data.entities.TournamentType

class TournamentAdapter(
    private val onViewClick: (Tournament) -> Unit,
    private val onManageClick: (Tournament) -> Unit
) : ListAdapter<Tournament, TournamentAdapter.TournamentViewHolder>(TournamentDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TournamentViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_tournament, parent, false)
        return TournamentViewHolder(view, onViewClick, onManageClick)
    }

    override fun onBindViewHolder(holder: TournamentViewHolder, position: Int) {
        val tournament = getItem(position)
        holder.bind(tournament)
    }

    class TournamentViewHolder(
        itemView: View,
        private val onViewClick: (Tournament) -> Unit,
        private val onManageClick: (Tournament) -> Unit
    ) : RecyclerView.ViewHolder(itemView) {
        
        private val tournamentName: TextView = itemView.findViewById(R.id.tournament_name)
        private val tournamentType: TextView = itemView.findViewById(R.id.tournament_type)
        private val tournamentInfo: TextView = itemView.findViewById(R.id.tournament_info)
        private val statusChip: Chip = itemView.findViewById(R.id.status_chip)
        private val viewButton: Button = itemView.findViewById(R.id.btn_view_tournament)
        private val manageButton: Button = itemView.findViewById(R.id.btn_manage_tournament)

        fun bind(tournament: Tournament) {
            tournamentName.text = tournament.name
            tournamentType.text = formatTournamentType(tournament.type)
            
            // TODO: Get actual player count from repository
            val playerCount = "8" // Placeholder
            tournamentInfo.text = "$playerCount players • Phase ${tournament.currentPhase} of ${tournament.maxPhases}"
            
            statusChip.text = formatStatus(tournament.status)
            setStatusChipColor(tournament.status)

            viewButton.setOnClickListener { onViewClick(tournament) }
            manageButton.setOnClickListener { onManageClick(tournament) }
        }

        private fun formatTournamentType(type: TournamentType): String {
            return when (type) {
                TournamentType.ROUND_ROBIN -> "Round Robin"
                TournamentType.KNOCKOUT -> "Knockout"
                TournamentType.GROUP_STAGE_KNOCKOUT -> "Group Stage + Knockout"
            }
        }

        private fun formatStatus(status: TournamentStatus): String {
            return when (status) {
                TournamentStatus.CREATED -> "Created"
                TournamentStatus.IN_PROGRESS -> "In Progress"
                TournamentStatus.PHASE_1_COMPLETE -> "Phase 1 Complete"
                TournamentStatus.PHASE_2_COMPLETE -> "Phase 2 Complete"
                TournamentStatus.FINISHED -> "Finished"
            }
        }

        private fun setStatusChipColor(status: TournamentStatus) {
            val context = itemView.context
            when (status) {
                TournamentStatus.CREATED -> {
                    statusChip.setChipBackgroundColorResource(R.color.padel_background)
                }
                TournamentStatus.IN_PROGRESS -> {
                    statusChip.setChipBackgroundColorResource(R.color.padel_secondary)
                }
                TournamentStatus.FINISHED -> {
                    statusChip.setChipBackgroundColorResource(R.color.padel_accent)
                }
                else -> {
                    statusChip.setChipBackgroundColorResource(R.color.padel_primary)
                }
            }
        }
    }

    private class TournamentDiffCallback : DiffUtil.ItemCallback<Tournament>() {
        override fun areItemsTheSame(oldItem: Tournament, newItem: Tournament): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Tournament, newItem: Tournament): Boolean {
            return oldItem == newItem
        }
    }
}