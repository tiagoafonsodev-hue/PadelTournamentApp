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

class PlayerSelectionAdapter(
    private val onSelectionChanged: (Int) -> Unit
) : ListAdapter<Player, PlayerSelectionAdapter.PlayerSelectionViewHolder>(PlayerDiffCallback()) {

    private val selectedPlayers = mutableSetOf<Long>()

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PlayerSelectionViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_player_selection, parent, false)
        return PlayerSelectionViewHolder(view)
    }

    override fun onBindViewHolder(holder: PlayerSelectionViewHolder, position: Int) {
        val player = getItem(position)
        holder.bind(player, selectedPlayers.contains(player.id)) { isSelected ->
            if (isSelected) {
                selectedPlayers.add(player.id)
            } else {
                selectedPlayers.remove(player.id)
            }
            onSelectionChanged(selectedPlayers.size)
        }
    }

    fun getSelectedPlayers(): List<Long> = selectedPlayers.toList()

    class PlayerSelectionViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val checkbox: CheckBox = itemView.findViewById(R.id.player_checkbox)
        private val playerName: TextView = itemView.findViewById(R.id.player_name_text)

        fun bind(player: Player, isSelected: Boolean, onSelectionChanged: (Boolean) -> Unit) {
            playerName.text = player.name
            checkbox.isChecked = isSelected
            
            checkbox.setOnCheckedChangeListener { _, isChecked ->
                onSelectionChanged(isChecked)
            }
            
            itemView.setOnClickListener {
                checkbox.isChecked = !checkbox.isChecked
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