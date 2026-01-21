package com.padel.tournament.ui.tournaments

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.CheckBox
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.padel.tournament.R
import com.padel.tournament.data.entities.Player

class TournamentPlayerSelectionAdapter(
    private val onPlayerToggle: (Player) -> Unit,
    private val isPlayerSelected: (Long) -> Boolean
) : ListAdapter<Player, TournamentPlayerSelectionAdapter.PlayerViewHolder>(PlayerDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PlayerViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_player_selection, parent, false)
        return PlayerViewHolder(view)
    }

    override fun onBindViewHolder(holder: PlayerViewHolder, position: Int) {
        val player = getItem(position)
        holder.bind(player, isPlayerSelected(player.id), onPlayerToggle)
    }

    class PlayerViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val checkbox: CheckBox = itemView.findViewById(R.id.player_checkbox)
        private val playerName: TextView = itemView.findViewById(R.id.player_name_text)

        fun bind(player: Player, isSelected: Boolean, onToggle: (Player) -> Unit) {
            playerName.text = player.name
            checkbox.isChecked = isSelected
            
            // Set listener after setting checked state to avoid triggering it
            checkbox.setOnCheckedChangeListener(null)
            checkbox.isChecked = isSelected
            checkbox.setOnCheckedChangeListener { _, _ ->
                onToggle(player)
            }
            
            itemView.setOnClickListener {
                onToggle(player)
            }
        }
    }

    private class PlayerDiffCallback : DiffUtil.ItemCallback<Player>() {
        override fun areItemsTheSame(oldItem: Player, newItem: Player): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: Player, newItem: Player): Boolean {
            return oldItem == newItem
        }
    }
}