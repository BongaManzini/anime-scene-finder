import pytest
from backend.app.services.video_service import parse_filename_metadata

def test_parse_filename_metadata():
    title, season, ep = parse_filename_metadata("JoJo's Bizarre Adventure S02E12.mp4")
    assert "JoJo" in title
    assert season == 2
    assert ep == 12

    title, season, ep = parse_filename_metadata("Attack_on_Titan_Ep_05.mkv")
    assert "Attack" in title
    assert season == 1
    assert ep == 5

    title, season, ep = parse_filename_metadata("Chika_Dance_03.webm")
    assert season == 1
    assert ep == 3
