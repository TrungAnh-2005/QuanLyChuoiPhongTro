package com.rental.notification;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class NotificationServiceTest {
    private final NotificationRepository repository = mock(NotificationRepository.class);
    private final NotificationService service = new NotificationService(repository);

    @Test void cannotReadAnotherUsersNotification() {
        when(repository.findByIdAndUserId(10L, 2L)).thenReturn(Optional.empty());
        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.markRead(10L, 2L));
        assertEquals(404, error.getStatusCode().value());
        verify(repository, never()).save(any());
    }

    @Test void marksOwnedNotificationAsRead() {
        Notification notification = new Notification();
        notification.setUserId(2L);
        when(repository.findByIdAndUserId(10L, 2L)).thenReturn(Optional.of(notification));
        when(repository.save(notification)).thenReturn(notification);
        assertTrue(service.markRead(10L, 2L).isRead());
        verify(repository).save(notification);
    }
}
