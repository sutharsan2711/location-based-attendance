package com.company.attendance.repository;

import com.company.attendance.entity.StickyNote;
import com.company.attendance.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StickyNoteRepository extends JpaRepository<StickyNote, Long> {

    List<StickyNote> findAllByOrderByIsPinnedDescUpdatedAtDesc();

    List<StickyNote> findByAdminUserOrderByIsPinnedDescUpdatedAtDesc(User adminUser);

    List<StickyNote> findByCategoryOrderByIsPinnedDescUpdatedAtDesc(String category);
}
