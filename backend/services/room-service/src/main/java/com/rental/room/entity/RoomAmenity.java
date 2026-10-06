package com.rental.room.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "room_amenities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomAmenity {

    @EmbeddedId
    private RoomAmenityId id;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    @Builder
    public static class RoomAmenityId implements Serializable {

        @Column(name = "room_id")
        private Long roomId;

        @Column(name = "amenity_id")
        private Long amenityId;
    }
}
