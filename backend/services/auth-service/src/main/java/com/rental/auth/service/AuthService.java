package com.rental.auth.service;

import com.rental.auth.dto.*;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    UserResponse register(RegisterRequest request);
    AuthResponse refreshToken(RefreshTokenRequest request);
    void changePassword(String username, ChangePasswordRequest request);
    UserResponse getCurrentUser(String username);
}
