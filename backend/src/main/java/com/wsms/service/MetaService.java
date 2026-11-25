package com.wsms.service;

import com.wsms.dto.MetaDto;
import com.wsms.repository.CategoryRepository;
import com.wsms.repository.DepartmentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/** Supplies lookup lists for dropdowns in the frontend. */
@Service
public class MetaService {

    private final DepartmentRepository departmentRepository;
    private final CategoryRepository categoryRepository;

    public MetaService(DepartmentRepository departmentRepository,
                       CategoryRepository categoryRepository) {
        this.departmentRepository = departmentRepository;
        this.categoryRepository = categoryRepository;
    }

    public MetaDto all() {
        List<MetaDto.Option> departments = departmentRepository.findAll().stream()
                .map(d -> new MetaDto.Option(d.getId(), d.getName())).toList();
        List<MetaDto.Option> categories = categoryRepository.findAll().stream()
                .map(c -> new MetaDto.Option(c.getId(), c.getName())).toList();
        return new MetaDto(departments, categories);
    }
}
