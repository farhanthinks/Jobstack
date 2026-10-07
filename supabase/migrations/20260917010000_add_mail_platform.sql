alter type job_platform add value if not exists 'Mail';

alter table jobs add column if not exists platform_other text;
