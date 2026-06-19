+++
title = "搜索"
date = 2026-06-19T20:00:00+08:00
draft = false
layout = "single"
+++

<link href="/pagefind/pagefind-ui.css" rel="stylesheet">
<script src="/pagefind/pagefind-ui.js"></script>

<div id="search"></div>

<script>
    window.addEventListener('DOMContentLoaded', (event) => {
        new PagefindUI({ 
            element: "#search", 
            showSubResults: true,
            translations: {
                placeholder: "输入关键词搜索文章...",
                clear_search: "清除",
                load_more: "加载更多结果",
                search_label: "搜索本站",
                filters_label: "筛选",
                zero_results: "没有找到关于 \"[SEARCH_TERM]\" 的内容",
                many_results: "找到 [COUNT] 条关于 \"[SEARCH_TERM]\" 的结果",
                one_result: "找到 1 条关于 \"[SEARCH_TERM]\" 的结果",
                alt_search: "没有找到结果，正在尝试搜索 \"[SEARCH_TERM]\" 的近似词"
            }
        });
    });
</script>