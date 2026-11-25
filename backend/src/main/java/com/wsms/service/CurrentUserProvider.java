package com.wsms.service;

import com.wsms.exception.ApiException;
import com.wsms.model.User;
import com.wsms.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/** Resolves the currently authenticated {@link User} from the security context. */
@Service
public class CurrentUserProvider {

    private final UserRepository userRepository;

    public CurrentUserProvider(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User require() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ApiException(org.springframework.http.HttpStatus.UNAUTHORIZED,
                    "Not authenticated");
        }
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> ApiException.notFound("Authenticated user not found"));
    }
}
