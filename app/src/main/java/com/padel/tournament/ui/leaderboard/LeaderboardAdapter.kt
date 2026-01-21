package com.padel.tournament.ui.leaderboard

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.padel.tournament.R
import com.padel.tournament.viewmodel.LeaderboardViewModel

class LeaderboardAdapter : ListAdapter<LeaderboardViewModel.PlayerWithStats, LeaderboardAdapter.LeaderboardViewHolder>(LeaderboardDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): LeaderboardViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_leaderboard, parent, false)
        return LeaderboardViewHolder(view)
    }

    override fun onBindViewHolder(holder: LeaderboardViewHolder, position: Int) {
        val playerWithStats = getItem(position)
        holder.bind(playerWithStats, position + 1)
    }

    class LeaderboardViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        
        private val rankNumber: TextView = itemView.findViewById(R.id.rank_number)
        private val playerName: TextView = itemView.findViewById(R.id.player_name)
        private val playerRecord: TextView = itemView.findViewById(R.id.player_record)
        private val winPercentage: TextView = itemView.findViewById(R.id.win_percentage)
        private val matchesPlayed: TextView = itemView.findViewById(R.id.matches_played)

        fun bind(playerWithStats: LeaderboardViewModel.PlayerWithStats, rank: Int) {
            val player = playerWithStats.player
            val stats = playerWithStats.stats
            
            rankNumber.text = rank.toString()
            playerName.text = player.name
            
            val winRate = if (stats.totalMatches > 0) {
                String.format("%.1f%%", stats.winPercentage)
            } else {
                "0.0%"
            }
            
            playerRecord.text = "${stats.matchesWon}W - ${stats.matchesLost}L ($winRate win rate)"
            winPercentage.text = winRate
            matchesPlayed.text = "${stats.totalMatches} matches"
            
            // Set special background color for top 3
            when (rank) {
                1 -> rankNumber.setBackgroundResource(R.drawable.gold_circle_background)
                2 -> rankNumber.setBackgroundResource(R.drawable.silver_circle_background)
                3 -> rankNumber.setBackgroundResource(R.drawable.bronze_circle_background)
                else -> rankNumber.setBackgroundResource(R.drawable.circle_background)
            }
        }
    }

    private class LeaderboardDiffCallback : DiffUtil.ItemCallback<LeaderboardViewModel.PlayerWithStats>() {
        override fun areItemsTheSame(
            oldItem: LeaderboardViewModel.PlayerWithStats, 
            newItem: LeaderboardViewModel.PlayerWithStats
        ): Boolean {
            return oldItem.player.id == newItem.player.id
        }

        override fun areContentsTheSame(
            oldItem: LeaderboardViewModel.PlayerWithStats, 
            newItem: LeaderboardViewModel.PlayerWithStats
        ): Boolean {
            return oldItem.player == newItem.player && oldItem.stats == newItem.stats
        }
    }
}