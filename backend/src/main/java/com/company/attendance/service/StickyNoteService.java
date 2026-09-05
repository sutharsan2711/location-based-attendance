package com.company.attendance.service;

import com.company.attendance.dto.StickyNoteRequest;
import com.company.attendance.entity.StickyNote;
import com.company.attendance.entity.User;
import com.company.attendance.repository.StickyNoteRepository;
import com.company.attendance.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StickyNoteService {

    private final StickyNoteRepository stickyNoteRepository;
    private final UserRepository userRepository;

    public StickyNoteService(StickyNoteRepository stickyNoteRepository, UserRepository userRepository) {
        this.stickyNoteRepository = stickyNoteRepository;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new RuntimeException("Unauthenticated user");
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found: " + auth.getName()));
    }

    @Transactional
    public StickyNote createNote(StickyNoteRequest req) {
        User admin = getCurrentUser();
        StickyNote note = new StickyNote();
        note.setTitle(req.getTitle() != null && !req.getTitle().isBlank() ? req.getTitle() : "Untitled Note");
        note.setContent(req.getContent() != null ? req.getContent() : "");
        note.setColor(req.getColor() != null ? req.getColor() : "yellow");
        note.setCategory(req.getCategory() != null ? req.getCategory() : "General");
        note.setIsPinned(req.getIsPinned() != null ? req.getIsPinned() : false);
        note.setChecklistJson(req.getChecklistJson());
        note.setAdminUser(admin);

        return stickyNoteRepository.save(note);
    }

    public List<StickyNote> getAllNotes() {
        return stickyNoteRepository.findAllByOrderByIsPinnedDescUpdatedAtDesc();
    }

    @Transactional
    public StickyNote updateNote(Long id, StickyNoteRequest req) {
        StickyNote note = stickyNoteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sticky note not found with ID: " + id));

        if (req.getTitle() != null) note.setTitle(req.getTitle());
        if (req.getContent() != null) note.setContent(req.getContent());
        if (req.getColor() != null) note.setColor(req.getColor());
        if (req.getCategory() != null) note.setCategory(req.getCategory());
        if (req.getIsPinned() != null) note.setIsPinned(req.getIsPinned());
        if (req.getChecklistJson() != null) note.setChecklistJson(req.getChecklistJson());

        return stickyNoteRepository.save(note);
    }

    @Transactional
    public void deleteNote(Long id) {
        if (!stickyNoteRepository.existsById(id)) {
            throw new RuntimeException("Sticky note not found with ID: " + id);
        }
        stickyNoteRepository.deleteById(id);
    }
}
