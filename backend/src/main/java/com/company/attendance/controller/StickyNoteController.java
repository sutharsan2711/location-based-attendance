package com.company.attendance.controller;

import com.company.attendance.dto.StickyNoteRequest;
import com.company.attendance.entity.StickyNote;
import com.company.attendance.service.StickyNoteService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notes")
public class StickyNoteController {

    private final StickyNoteService stickyNoteService;

    public StickyNoteController(StickyNoteService stickyNoteService) {
        this.stickyNoteService = stickyNoteService;
    }

    @PostMapping
    public ResponseEntity<StickyNote> createNote(@RequestBody StickyNoteRequest request) {
        return ResponseEntity.ok(stickyNoteService.createNote(request));
    }

    @GetMapping
    public ResponseEntity<List<StickyNote>> getAllNotes() {
        return ResponseEntity.ok(stickyNoteService.getAllNotes());
    }

    @PutMapping("/{id}")
    public ResponseEntity<StickyNote> updateNote(
            @PathVariable Long id,
            @RequestBody StickyNoteRequest request) {
        return ResponseEntity.ok(stickyNoteService.updateNote(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteNote(@PathVariable Long id) {
        stickyNoteService.deleteNote(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Note deleted successfully."));
    }
}
