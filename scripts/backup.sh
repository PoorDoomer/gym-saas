#!/bin/bash
pg_dump $DATABASE_URL > backup.sql
