import json
import os

from rosreestr2coord import Area
from rosreestr2coord.merge_tiles import PkkAreaMerger
from PIL import Image
from rosreestr2coord.utils import xy2lonlat, TimeoutException


class GetArea(Area):
    def __init__(self, code):
        super().__init__(code, use_cache=True)
        self.code = code
        # self.timeout = timeout

    def download_feature_info(self):
        feature_info_path = os.path.join(self.workspace, "feature_info.json")
        data = False
        if feature_info_path:
            try:
                with open(feature_info_path, "r") as data_file:
                    data = json.loads(data_file.read())
            except Exception:
                pass
        try:
            if not data:
                search_url = self.feature_info_url + self.clear_code(self.code)
                self.log("Start downloading area info: %s" % search_url)
                resp = self.make_request(search_url)
                data = json.loads(resp.decode("utf-8"))
                if data and "feature" in data:
                    feature = data["feature"]
                    if feature:
                        self.log("Area info downloaded.")
                        with open(feature_info_path, "w") as outfile:
                            json.dump(data, outfile)
                    else:
                        self.log(
                            "Area info is not loaded. Check the area type and try again"
                        )
            else:
                self.log("Area info loaded from file: {}".format(
                    feature_info_path))
            if data:
                feature = data.get("feature")
                if feature:
                    attrs = feature.get("attrs")
                    if attrs:
                        self.attrs = attrs
                        self.code_id = attrs["id"]
                    if feature.get("extent"):
                        self.extent = feature["extent"]
                    if feature.get("center"):
                        x = feature["center"]["x"]
                        y = feature["center"]["y"]
                        if self.coord_out == "EPSG:4326":
                            (x, y) = xy2lonlat(x, y)
                        self.center = {"x": x, "y": y}
                        self.attrs["center"] = self.center
                return feature
        except TimeoutException:
            raise TimeoutException()
        except Exception as error:
            self.error(error)
            raise error
        return False

    def parse_geometry_from_image(self):
        formats = ["png"]
        for f in formats:
            bbox = self.get_buffer_extent_list()
            if bbox:
                image = NewPkkAreaMerger(
                    bbox=self.get_buffer_extent_list(),
                    output_format=f,
                    with_log=self.with_log,
                    clear_code=self.clear_code(self.code_id),
                    output_dir=self.workspace,
                    requester=self.make_request,
                    use_cache=self.use_cache,
                    area_type=self.area_type,
                )
                image.download()
                self.image_path = image.merge_tiles()
                self.width = image.real_width
                self.height = image.real_height
                self.image_extent = image.image_extent
                if image:
                    return self.get_image_geometry()


class NewPkkAreaMerger(PkkAreaMerger):

    def merge_tiles(self):
        if self.count == self.total:
            if self.count > 1:
                path = self._merge_tiles()
            else:
                path = os.path.join(self.tile_dir, "%s_%s%s" %
                                    (0, 0, self.tile_format))
            tile = Image.open(path)
            self.real_width = tile.width
            self.real_height = tile.height
            tile.close()
            bb = self.bbox
            xmax = max([x["xmax"] for x in self._image_extent_list])
            ymax = max([x["ymax"] for x in self._image_extent_list])
            self.image_extent = {
                "xmin": bb[0],
                "ymin": bb[1],
                "xmax": xmax,
                "ymax": ymax,
            }
            outpath = os.path.abspath(path)
            self.log("raster - %s" % outpath)
            return outpath
