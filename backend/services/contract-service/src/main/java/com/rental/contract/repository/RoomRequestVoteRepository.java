package com.rental.contract.repository;

import com.rental.contract.entity.RoomRequestVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomRequestVoteRepository extends JpaRepository<RoomRequestVote, RoomRequestVote.VoteId> {
    List<RoomRequestVote> findByRequestId(Long requestId);
}
