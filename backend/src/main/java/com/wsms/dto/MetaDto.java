package com.wsms.dto;

import java.util.List;

/** Lookup data for dropdowns: departments (registration) and categories (admin item form). */
public record MetaDto(
        List<Option> departments,
        List<Option> categories
) {
    public record Option(Long id, String label) {
    }
}
