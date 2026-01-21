package com.padel.tournament.ui.players

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.padel.tournament.R
import com.padel.tournament.data.entities.Player

class PlayerAdapter(
    private val onEditClick: (Player) -> Unit,
    private val onDeleteClick: (Player) -> Unit
) : ListAdapter<Player, PlayerAdapter.PlayerViewHolder>(PlayerDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): PlayerViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_player, parent, false)
        return PlayerViewHolder(view, onEditClick, onDeleteClick)
    }

    override fun onBindViewHolder(holder: PlayerViewHolder, position: Int) {
        val player = getItem(position)
        holder.bind(player)
    }

    class PlayerViewHolder(
        itemView: View,
        private val onEditClick: (Player) -> Unit,
        private val onDeleteClick: (Player) -> Unit
    ) : RecyclerView.ViewHolder(itemView) {
        
        private val playerName: TextView = itemView.findViewById(R.id.player_name)
        private val playerEmail: TextView = itemView.findViewById(R.id.player_email)
        private val playerPhone: TextView = itemView.findViewById(R.id.player_phone)
        private val editButton: ImageButton = itemView.findViewById(R.id.btn_edit_player)
        private val deleteButton: ImageButton = itemView.findViewById(R.id.btn_delete_player)

        fun bind(player: Player) {
            playerName.text = player.name
            
            if (player.email.isNullOrBlank()) {
                playerEmail.visibility = View.GONE
            } else {
                playerEmail.text = player.email
                playerEmail.visibility = View.VISIBLE
            }
            
            if (player.phoneNumber.isNullOrBlank()) {
                playerPhone.visibility = View.GONE
            } else {
                playerPhone.text = player.phoneNumber
                playerPhone.visibility = View.VISIBLE
            }

            editButton.setOnClickListener { onEditClick(player) }
            deleteButton.setOnClickListener { onDeleteClick(player) }
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