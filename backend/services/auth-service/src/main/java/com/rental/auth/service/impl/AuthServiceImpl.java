package com.rental.auth.service.impl;

import com.rental.auth.dto.*;
import com.rental.auth.entity.RefreshToken;
import com.rental.auth.entity.Role;
import com.rental.auth.entity.User;
import com.rental.auth.entity.UserStatus;
import com.rental.auth.exception.AppException;
import com.rental.auth.repository.RefreshTokenRepository;
import com.rental.auth.repository.RoleRepository;
import com.rental.auth.repository.UserRepository;
import com.rental.auth.security.JwtTokenProvider;
import com.rental.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsernameOrEmail(request.getUsernameOrEmail(), request.getUsernameOrEmail())
                .orElseThrow(() -> new AppException("Invalid username or password", HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AppException("User account is " + user.getStatus().name(), HttpStatus.FORBIDDEN, "ACCOUNT_INACTIVE");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword())
        );

        String accessToken = jwtTokenProvider.generateToken(user);
        String refreshTokenString = jwtTokenProvider.generateRefreshTokenString();

        RefreshToken refreshToken = RefreshToken.builder()
                .token(refreshTokenString)
                .user(user)
                .expiryDate(Instant.now().plusMillis(jwtTokenProvider.getRefreshExpiration()))
                .revoked(false)
                .build();

        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenString)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getJwtExpiration() / 1000)
                .user(mapToUserResponse(user))
                .build();
    }

    @Override
    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException("Username is already taken", HttpStatus.BAD_REQUEST, "USERNAME_EXISTS");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException("Email is already registered", HttpStatus.BAD_REQUEST, "EMAIL_EXISTS");
        }

        String targetRoleName = "ROLE_TENANT";
        if (request.getRole() != null && !request.getRole().isBlank()) {
            String roleUpper = request.getRole().trim().toUpperCase();
            targetRoleName = roleUpper.startsWith("ROLE_") ? roleUpper : "ROLE_" + roleUpper;
        }

        final String roleNameToFind = targetRoleName;
        Role role = roleRepository.findByName(roleNameToFind)
                .orElseGet(() -> roleRepository.save(Role.builder().name(roleNameToFind).build()));

        Set<Role> roles = new HashSet<>();
        roles.add(role);

        User user = User.builder()
                .username(request.getUsername().trim())
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .phone(request.getPhone() != null ? request.getPhone().trim() : null)
                .status(UserStatus.ACTIVE)
                .roles(roles)
                .build();

        User savedUser = userRepository.save(user);
        return mapToUserResponse(savedUser);
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenAndRevokedFalse(request.getRefreshToken())
                .orElseThrow(() -> new AppException("Invalid or revoked refresh token", HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN"));

        if (refreshToken.getExpiryDate().isBefore(Instant.now())) {
            refreshToken.setRevoked(true);
            refreshTokenRepository.save(refreshToken);
            throw new AppException("Refresh token has expired", HttpStatus.UNAUTHORIZED, "EXPIRED_REFRESH_TOKEN");
        }

        User user = refreshToken.getUser();
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AppException("User account is inactive", HttpStatus.FORBIDDEN, "ACCOUNT_INACTIVE");
        }

        String newAccessToken = jwtTokenProvider.generateToken(user);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getJwtExpiration() / 1000)
                .user(mapToUserResponse(user))
                .build();
    }

    @Override
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new AppException("Current password is incorrect", HttpStatus.BAD_REQUEST, "INVALID_CURRENT_PASSWORD");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException("User not found", HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));

        return mapToUserResponse(user);
    }

    private UserResponse mapToUserResponse(User user) {
        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .status(user.getStatus().name())
                .roles(roleNames)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
