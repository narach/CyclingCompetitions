resource "aws_resourcegroups_group" "service_group" {
  name        = "cycling_mne"
  description = "Resource group for cycling-mne"
  resource_query {
    type  = "TAG_FILTERS_1_0"
    query = jsonencode({
      ResourceTypeFilters = [
        "AWS::AllSupported"
      ]
      TagFilters = [
        {
          Key    = "service_name"
          Values = [var.service_tag]
        }
      ]
    })
  }
}

