package com.wsms.controller;

import com.wsms.dto.MetaDto;
import com.wsms.service.MetaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public lookup data used by the registration form. */
@RestController
@RequestMapping("/api/meta")
public class MetaController {

    private final MetaService metaService;

    public MetaController(MetaService metaService) {
        this.metaService = metaService;
    }

    @GetMapping
    public MetaDto meta() {
        return metaService.all();
    }
}
