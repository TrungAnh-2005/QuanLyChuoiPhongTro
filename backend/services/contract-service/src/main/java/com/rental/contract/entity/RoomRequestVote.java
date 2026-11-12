package com.rental.contract.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "room_request_votes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(RoomRequestVote.VoteId.class)
public class RoomRequestVote {

    @Id
    @Column(name = "request_id", nullable = false)
    private Long requestId;

    @Id
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Boolean approved;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VoteId implements Serializable {
        private Long requestId;
        private Long userId;
    }
}
