"""Script Pi 2.5: asignacion de lectores por puerto USB fisico (estable aunque cambie /dev/input/eventX)."""
import importlib
import logging
import sys
from types import SimpleNamespace

sys.path.insert(0, '/app')
logging.FileHandler = lambda *a, **k: logging.StreamHandler()


def load(tmp_path, monkeypatch, env=None):
    for k, v in (env or {}).items():
        monkeypatch.setenv(k, v)
    import raspberry_access_control as r
    r = importlib.reload(r)
    r.PAIRING_FILE = str(tmp_path / 'lectores.json')
    c = r.AccessController.__new__(r.AccessController)
    c.reported = []
    c._report_command = lambda cid, ok, out: c.reported.append((cid, ok, out))
    c.reader_names, c.reader_dirs, c.readers, c.reader_mode = [], {}, [], ''
    c.pairing_until, c.pairing_command_id = 0, None
    return r, c


def dev(path, port):
    return SimpleNamespace(path=path, phys=f"usb-0000:01:00.0-{port}/input0", name="MEGAHUNT")


def dirs(assignments):
    return {d.phys.split('-')[-1].split('/')[0]: direc for d, direc in assignments}


def test_pairing_survives_event_renumbering(tmp_path, monkeypatch):
    r, c = load(tmp_path, monkeypatch)
    puerta_entrada, puerta_salida = dev('/dev/input/event2', '1.3'), dev('/dev/input/event3', '1.4')
    c.readers = [puerta_entrada, puerta_salida]
    a, mode = c._assign_readers(c.readers)
    assert 'SIN EMPAREJAR' in mode
    # Emparejar: QR escaneado en el lector fisico de la entrada (puerto 1.4 aqui)
    c.pairing_command_id = 'cmd1'
    c._complete_pairing(puerta_salida)
    assert c.reported[-1][1] is True
    assert c.reader_dirs == {'/dev/input/event3': 'entrada', '/dev/input/event2': 'salida'}
    # "Reinicio": Linux renumera los eventX al reves
    after = [dev('/dev/input/event2', '1.4'), dev('/dev/input/event3', '1.3')]
    a, mode = c._assign_readers(after)
    assert 'emparejado' in mode and dirs(a) == {'1.4': 'entrada', '1.3': 'salida'}


def test_env_port_overrides_and_invert_ignored(tmp_path, monkeypatch):
    r, c = load(tmp_path, monkeypatch, {'LECTOR_ENTRADA_PUERTO': 'usb-0000:01:00.0-1.3', 'INVERTIR_LECTORES': '1'})
    a, mode = c._assign_readers([dev('/dev/input/event2', '1.4'), dev('/dev/input/event3', '1.3')])
    assert 'LECTOR_ENTRADA_PUERTO' in mode and dirs(a) == {'1.3': 'entrada', '1.4': 'salida'}
    monkeypatch.delenv('LECTOR_ENTRADA_PUERTO')
    monkeypatch.delenv('INVERTIR_LECTORES')


def test_unpaired_keeps_legacy_invert(tmp_path, monkeypatch):
    r, c = load(tmp_path, monkeypatch, {'INVERTIR_LECTORES': '1'})
    a, mode = c._assign_readers([dev('/dev/input/event2', '1.3'), dev('/dev/input/event3', '1.4')])
    assert 'SIN EMPAREJAR' in mode and dirs(a) == {'1.4': 'entrada', '1.3': 'salida'}
    monkeypatch.delenv('INVERTIR_LECTORES')


def test_pairing_needs_two_readers(tmp_path, monkeypatch):
    r, c = load(tmp_path, monkeypatch)
    c.readers = [dev('/dev/input/event2', '1.3')]
    c._start_pairing('cmd2')
    assert c.reported == [('cmd2', False, 'Se necesitan 2 lectores conectados para emparejar')]
