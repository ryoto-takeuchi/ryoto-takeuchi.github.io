---
title: 学習
---

{% include nav.html %}

# 学習（カテゴリ）
<ul>
{% assign groups = site.learning | group_by_exp: "p", "p.path | split: '/' | slice: 1,1 | first" %}
{% for g in groups %}
  {% if g.name %}
  <li><a href="/learning/{{ g.name }}/">{{ g.name }}</a> ({{ g.items | size }} docs)</li>
  {% endif %}
{% endfor %}
</ul>
