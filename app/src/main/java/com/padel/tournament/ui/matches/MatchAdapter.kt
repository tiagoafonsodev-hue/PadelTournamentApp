package com.padel.tournament.ui.matches

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
import com.padel.tournament.data.entities.Match
import com.padel.tournament.data.entities.MatchStatus
import com.padel.tournament.data.entities.Player

class MatchAdapter(
    private val onEnterResult: (Match) -> Unit
) : ListAdapter<MatchWithPlayers, MatchAdapter.MatchViewHolder>(MatchDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MatchViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_match, parent, false)
        return MatchViewHolder(view, onEnterResult)
    }

    override fun onBindViewHolder(holder: MatchViewHolder, position: Int) {
        val matchWithPlayers = getItem(position)
        holder.bind(matchWithPlayers)
    }

    class MatchViewHolder(
        itemView: View,
        private val onEnterResult: (Match) -> Unit
    ) : RecyclerView.ViewHolder(itemView) {
        
        private val matchNumber: TextView = itemView.findViewById(R.id.match_number)
        private val team1Players: TextView = itemView.findViewById(R.id.team1_players)
        private val team2Players: TextView = itemView.findViewById(R.id.team2_players)
        private val matchScore: TextView = itemView.findViewById(R.id.match_score)
        private val setScores: TextView = itemView.findViewById(R.id.set_scores)
        private val statusChip: Chip = itemView.findViewById(R.id.status_chip)
        private val enterResultButton: Button = itemView.findViewById(R.id.btn_enter_result)

        fun bind(matchWithPlayers: MatchWithPlayers) {
            val match = matchWithPlayers.match
            val players = matchWithPlayers.players
            
            matchNumber.text = match.matchNumber.toString()
            
            val player1Name = players.find { it.id == match.player1Id }?.name ?: "Player 1"
            val player2Name = players.find { it.id == match.player2Id }?.name ?: "Player 2"
            val player3Name = players.find { it.id == match.player3Id }?.name ?: "Player 3"
            val player4Name = players.find { it.id == match.player4Id }?.name ?: "Player 4"
            
            team1Players.text = "$player1Name & $player2Name"
            team2Players.text = "$player3Name & $player4Name"
            
            when (match.status) {
                MatchStatus.COMPLETED -> {
                    matchScore.text = "${match.team1Score}-${match.team2Score}"
                    matchScore.visibility = View.VISIBLE
                    
                    val sets = mutableListOf<String>()
                    if (match.set1Team1 != null && match.set1Team2 != null) {
                        sets.add("${match.set1Team1}-${match.set1Team2}")
                    }
                    if (match.set2Team1 != null && match.set2Team2 != null) {
                        sets.add("${match.set2Team1}-${match.set2Team2}")
                    }
                    if (match.set3Team1 != null && match.set3Team2 != null) {
                        sets.add("${match.set3Team1}-${match.set3Team2}")
                    }
                    
                    if (sets.isNotEmpty()) {
                        setScores.text = sets.joinToString(", ")
                        setScores.visibility = View.VISIBLE
                    } else {
                        setScores.visibility = View.GONE
                    }
                    
                    statusChip.text = "Completed"
                    statusChip.setChipBackgroundColorResource(R.color.padel_accent)
                    
                    enterResultButton.text = "Edit Result"
                    enterResultButton.visibility = View.VISIBLE
                }
                MatchStatus.SCHEDULED -> {
                    matchScore.visibility = View.GONE
                    setScores.visibility = View.GONE
                    statusChip.text = "Pending"
                    statusChip.setChipBackgroundColorResource(R.color.padel_secondary)
                    
                    enterResultButton.text = "Enter Result"
                    enterResultButton.visibility = View.VISIBLE
                }
                else -> {
                    matchScore.visibility = View.GONE
                    setScores.visibility = View.GONE
                    statusChip.text = match.status.name
                    statusChip.setChipBackgroundColorResource(R.color.padel_background)
                    
                    enterResultButton.visibility = View.GONE
                }
            }
            
            enterResultButton.setOnClickListener {
                onEnterResult(match)
            }
        }
    }

    private class MatchDiffCallback : DiffUtil.ItemCallback<MatchWithPlayers>() {
        override fun areItemsTheSame(oldItem: MatchWithPlayers, newItem: MatchWithPlayers): Boolean {
            return oldItem.match.id == newItem.match.id
        }

        override fun areContentsTheSame(oldItem: MatchWithPlayers, newItem: MatchWithPlayers): Boolean {
            return oldItem.match == newItem.match && oldItem.players == newItem.players
        }
    }
}

data class MatchWithPlayers(
    val match: Match,
    val players: List<Player>
)